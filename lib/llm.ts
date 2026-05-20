/**
 * lib/llm.ts
 * Cerebras matchmaking wrapper — llama3.1-8b (single model, no fallback)
 *
 * Rate limits:
 *   rpm 5 | rph 150 | rpd 2400 | tpm 30k | tph 1M | tpd 1M
 *   Max context length: 8,192 tokens (llama3.1-8b)
 *
 * Optimization Strategy:
 *   - Batch size: 50 candidates per request.
 *     Target (~80 tokens) + 50 Candidates (~4000 tokens) + Prompt/System (~200 tokens) + Response (~512 tokens)
 *     Total ≈ 4.8k tokens, well within the 8,192 context limit.
 *   - For 100 candidates, this requires exactly 2 requests.
 *   - We run requests sequentially with a 2-second delay to prevent concurrent burst errors.
 *   - Double-layered sliding window rate limiter for both RPM (5) and RPH (150).
 */

const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions'
const MODEL        = 'gpt-oss-120b'
const BATCH_SIZE   = 100

// Keep track of request timestamps to enforce RPM (5) and RPH (150)
const requestTimestamps: number[] = []

async function waitForRateLimitSlot(): Promise<void> {
  const now = Date.now()

  // 1. Clean up timestamps older than 1 hour (3,600,000 ms)
  while (requestTimestamps.length && now - requestTimestamps[0] > 3_600_000) {
    requestTimestamps.shift()
  }

  // 2. Check Hourly Limit (RPH = 150)
  if (requestTimestamps.length >= 150) {
    const oldestInHour = requestTimestamps[0]
    const waitTime = 3_600_000 - (now - oldestInHour) + 1000
    console.warn(`[llm] RPH limit (150) reached. Waiting ${Math.round(waitTime / 1000)}s...`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
    return waitForRateLimitSlot()
  }

  // 3. Check Minute Limit (RPM = 5)
  const oneMinuteAgo = now - 60_000
  const requestsInLastMinute = requestTimestamps.filter(t => t > oneMinuteAgo)
  if (requestsInLastMinute.length >= 5) {
    const oldestInMinute = requestsInLastMinute[0]
    const waitTime = 60_000 - (now - oldestInMinute) + 1000
    console.warn(`[llm] RPM limit (5) reached. Waiting ${Math.round(waitTime / 1000)}s...`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
    return waitForRateLimitSlot()
  }

  // Slot is available
  requestTimestamps.push(Date.now())
}

export interface LLMMatchResult {
  id:          string
  similarity:  number
  explanation: string
}

type Profile = { id: string; name: string; role: string | null; mandate: string }

// Global promise chain to serialize all API requests to Cerebras (concurrency = 1)
let globalQueue: Promise<any> = Promise.resolve()

async function callCerebras(prompt: string, modelName = MODEL): Promise<string> {
  const apiKey = process.env.CEREBRAS_API_KEY
  if (!apiKey) throw new Error('CEREBRAS_API_KEY is not set')

  const execution = async () => {
    // 1. Enforce sliding window rate limits (RPM = 5, RPH = 150)
    await waitForRateLimitSlot()

    // 2. Enforce a minimum gap of 2 seconds between starts to prevent concurrent bursts
    const now = Date.now()
    if (requestTimestamps.length >= 2) {
      const lastCall = requestTimestamps[requestTimestamps.length - 2]
      const minSpacing = 2000 // 2 seconds gap
      const elapsed = now - lastCall
      if (elapsed < minSpacing) {
        await new Promise(resolve => setTimeout(resolve, minSpacing - elapsed))
      }
    }

    const res = await fetch(CEREBRAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       modelName,
        stream:      false,
        temperature: 0,
        top_p:       1,
        messages: [
          {
            role:    'system',
            content: `You are a matchmaking engine for a Web3 conference. Score candidate profiles against a target profile.

SCORING — evaluate each candidate on 4 dimensions:
  D1: NEED↔OFFER — Does one mandate explicitly seek what the other provides?
  D2: ROLE COMPLEMENTARITY — Do the roles naturally work together? (e.g. investor↔founder, auditor↔builder). Same roles score LOW.
  D3: DOMAIN ALIGNMENT — Same Web3 vertical? (DeFi, ZK, RWA, DePIN, etc.)
  D4: SPECIFICITY — Do specific details overlap? (stage, geography, tech stack)

SCORE THRESHOLDS:
  0.90–1.00 = explicit mutual need + complementary roles + same domain
  0.75–0.89 = strong role fit with clear mutual benefit
  0.60–0.74 = moderate overlap
  Below 0.60 = weak, omit unless nothing better exists

ABSOLUTE RULE — EXPLANATION TEXT:
Your explanation must be assembled from VERBATIM FRAGMENTS copied from the Role and Mandate fields only.
DO NOT introduce any word, name, company, blockchain, or technology that does not appear character-for-character in the input text.
If a term is not in the input, it does not exist. Do not infer. Do not complete. Do not embellish.

OUTPUT: Return ONLY valid JSON. No markdown, no prose outside JSON.`,
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText)
      throw new Error(`Cerebras ${res.status}: ${errText}`)
    }

    const json: any = await res.json()
    return json?.choices?.[0]?.message?.content ?? ''
  }

  // Chain onto the global queue and return the promise
  const nextInQueue = globalQueue.then(execution)
  globalQueue = nextInQueue.then(() => {}).catch(() => {})
  return nextInQueue
}

// Truncate mandate to stay within TPM budget — gpt-oss-120b is token-heavy
const MAX_MANDATE_CHARS = 180
function trim(text: string | null | undefined, max = MAX_MANDATE_CHARS): string {
  if (!text) return 'N/A'
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

function buildPrompt(me: Profile, candidates: Profile[], limit: number): string {
  const list = candidates
    .map((c, i) => [
      `[${i + 1}] ID: ${c.id}`,
      `    Role: ${trim(c.role, 80)}`,
      `    Mandate: ${trim(c.mandate)}`,
    ].join('\n'))
    .join('\n\n')

  return `Analyze these ${candidates.length} pre-filtered candidates and select the TOP ${limit} matches for the TARGET.

TARGET PROFILE:
  Role: ${me.role ?? 'N/A'}
  Mandate: ${me.mandate}

CANDIDATE POOL:
${list}

INSTRUCTIONS:
Select up to ${limit} candidates with similarity >= 0.70, sorted descending.

For each selected match write a one-sentence explanation using ONLY words that appear verbatim in the Role or Mandate fields shown above.
Do NOT add any word, name, company, chain, or technology that is not present in the input text.
Template (fill blanks with exact words from the profiles):
  "[fragment from candidate mandate/role] aligns with [fragment from target mandate/role]."

Return ONLY this JSON, no other text:
{"matches":[{"id":"<candidate uuid>","similarity":<float 0-1>,"explanation":"<one sentence>"}]}`
}

function parseMatches(raw: string, limit: number): LLMMatchResult[] {
  // 1. Try standard JSON parsing
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed?.matches)) return parsed.matches.slice(0, limit)
  } catch { /* fall through */ }

  // 2. Try parsing just the brace-enclosed object
  const m = raw.match(/\{[\s\S]*\}/)
  if (m) {
    try {
      const parsed = JSON.parse(m[0])
      if (Array.isArray(parsed?.matches)) return parsed.matches.slice(0, limit)
    } catch { /* fall through */ }
  }

  // 3. Fallback: Parse individual match items with a robust RegExp (e.g. if the JSON is truncated)
  const results: LLMMatchResult[] = []
  // Matches: { "id": "...", "similarity": ..., "explanation": "..." }
  const objectRegex = /\{[^{}]+\}/g
  let objMatch: RegExpExecArray | null

  while ((objMatch = objectRegex.exec(raw)) !== null) {
    const objText = objMatch[0]
    const idM = objText.match(/"id"\s*:\s*"([^"]+)"/)
    const simM = objText.match(/"similarity"\s*:\s*([0-9.]+)/)
    const expM = objText.match(/"explanation"\s*:\s*"([^"]*)"?/)

    if (idM && simM) {
      results.push({
        id: idM[1],
        similarity: parseFloat(simM[1]),
        explanation: expM ? expM[1] : ''
      })
    }
  }

  if (results.length > 0) {
    return results.slice(0, limit)
  }

  console.warn('[llm] Could not parse matches from response:', raw)
  return []
}

/**
 * getCerebrasMatches
 *
 * Groups candidates into batches of 50, running requests sequentially
 * with a 2-second spacing to prevent concurrent connection limit issues.
 * rate limits (RPM = 5, RPH = 150) are strictly checked and enforced.
 */
export async function getCerebrasMatches(
  me:         Profile,
  candidates: Profile[],
  limit:      number,
): Promise<LLMMatchResult[]> {
  const batches: Profile[][] = []
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    batches.push(candidates.slice(i, i + BATCH_SIZE))
  }

  const allResults: LLMMatchResult[] = []
  for (let i = 0; i < batches.length; i++) {
    const prompt = buildPrompt(me, batches[i], limit)
    let raw = ''
    let success = false
    const errors: string[] = []

    // Fallback chain: gpt-oss-120b -> llama3.1-70b -> llama3.1-8b
    const modelsToTry = [MODEL, 'llama3.1-70b', 'llama3.1-8b']

    for (const model of modelsToTry) {
      try {
        if (model !== MODEL) {
          console.warn(`[llm] Falling back to model: ${model} (previous attempts failed)`)
        }
        raw = await callCerebras(prompt, model)
        success = true
        break
      } catch (err: any) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.warn(`[llm] Failed with model ${model}: ${errMsg}`)
        errors.push(`${model}: ${errMsg}`)
        // Continue to the next model in the fallback chain
      }
    }

    if (success) {
      const results = parseMatches(raw, limit)
      allResults.push(...results)
    } else {
      console.error(`[llm] All models in fallback chain failed for batch ${i + 1}/${batches.length}. Errors:`, errors)
    }
  }

  return allResults
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}
