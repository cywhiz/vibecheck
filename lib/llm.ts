/**
 * lib/llm.ts
 * Dual-provider matchmaking: Claude (primary) → Cerebras (fallback)
 *
 * Claude (Anthropic):
 *   Model: claude-opus-4-6
 *   Rate limits: managed via sliding window (5 RPM, 150 RPH)
 *
 * Cerebras (backup):
 *   Model: gpt-oss-120b → llama-3.1-70b → llama-3.1-8b
 *   Rate limits: RPM 5, RPH 150, TPM 30k
 *   Max context length: 8,192 tokens
 *
 * Optimization: double-layered sliding window for both providers.
 */

// ── Endpoints ────────────────────────────────────────────────────────────
const ANTHROPIC_URL  = 'https://api.anthropic.com/v1/messages'
const CEREBRAS_URL   = 'https://api.cerebras.ai/v1/chat/completions'
const ANTHROPIC_MODEL = 'claude-opus-4-6'
const CEREBRAS_MODEL  = 'gpt-oss-120b'
const BATCH_SIZE      = 100

// ── Rate limit tracking ──────────────────────────────────────────────────
const requestTimestamps: Record<string, number[]> = {
  claude:   [],
  cerebras: [],
}

async function waitForRateLimitSlot(provider: 'claude' | 'cerebras'): Promise<void> {
  const timestamps = requestTimestamps[provider]
  const now = Date.now()
  const RPM = 5
  const RPH = 150

  // 1. Clean timestamps older than 1 hour
  while (timestamps.length && now - timestamps[0] > 3_600_000) {
    timestamps.shift()
  }

  // 2. Hourly limit
  if (timestamps.length >= RPH) {
    const oldest = timestamps[0]
    const waitMs = 3_600_000 - (now - oldest) + 1000
    console.warn(`[llm:${provider}] RPH limit reached. Waiting ${Math.round(waitMs / 1000)}s...`)
    await new Promise(resolve => setTimeout(resolve, waitMs))
    return waitForRateLimitSlot(provider)
  }

  // 3. Minute limit
  const oneMinuteAgo = now - 60_000
  const requestsInMinute = timestamps.filter(t => t > oneMinuteAgo)
  if (requestsInMinute.length >= RPM) {
    const oldest = requestsInMinute[0]
    const waitMs = 60_000 - (now - oldest) + 1000
    console.warn(`[llm:${provider}] RPM limit reached. Waiting ${Math.round(waitMs / 1000)}s...`)
    await new Promise(resolve => setTimeout(resolve, waitMs))
    return waitForRateLimitSlot(provider)
  }

  // 4. Enforce 2s minimum gap between starts
  if (timestamps.length >= 2) {
    const lastCall = timestamps[timestamps.length - 2]
    const elapsed = now - lastCall
    if (elapsed < 2000) {
      await new Promise(resolve => setTimeout(resolve, 2000 - elapsed))
    }
  }

  timestamps.push(Date.now())
}

// ── Serialization queue per provider ─────────────────────────────────────
const globalQueues: Record<string, Promise<any>> = {
  claude:   Promise.resolve(),
  cerebras: Promise.resolve(),
}

function enqueue(provider: 'claude' | 'cerebras', fn: () => Promise<string>): Promise<string> {
  const nextInQueue = globalQueues[provider].then(fn)
  globalQueues[provider] = nextInQueue.then(() => {}).catch(() => {})
  return nextInQueue
}

// ── Shared types ─────────────────────────────────────────────────────────
export interface LLMMatchResult {
  id:          string
  similarity:  number
  explanation: string
}

type Profile = { id: string; name: string; role: string | null; mandate: string }

// ── Prompt truncation ────────────────────────────────────────────────────
const MAX_MANDATE_CHARS = 220
function trim(text: string | null | undefined, max = MAX_MANDATE_CHARS): string {
  if (!text) return 'N/A'
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

// ── System prompt (shared between providers) ─────────────────────────────
const SYSTEM_PROMPT = `You are a precision conference matchmaking engine for a Web3 networking event (SEABW). Your goal is to identify high-value synergies across ALL attendee archetypes.

SOFT SCORING FLOOR & NO EXTREMES:
Do not grade in a binary way. At a Web3 conference, every professional has networking value to others. You MUST map matches to a soft baseline spectrum. Apply this role-based scoring guide:
  1. DIRECT TARGET SYNERGY (score 0.90 - 0.98): Perfect match (e.g., VC seeking DePIN ↔ Founder building DePIN).
  2. GENERAL FOUNDER-INVESTOR SYNERGY (score 0.78 - 0.88): A VC and a founder building in ANY other vertical (e.g., DeFi, Gaming, RWA) because VCs invest in high-growth startups and follow multiple trends.
  3. BUILDER-DEVELOPER / SECURITY SYNERGY (score 0.70 - 0.77): A VC/founder matching with Solidity/Rust Developers, ZK Researchers, or Smart Contract Auditors (highly valuable for portfolio hiring, technical intelligence, and security audits).
  4. ADVISORY & ECOSYSTEM SYNERGY (score 0.60 - 0.69): A VC/founder matching with Web3 Lawyers, Tokenomics Architects, L2 Growth leads, or Recruiters (critical legal frameworks, recruitment, and token modeling support).
  5. GENERAL NETWORKING (score 0.45 - 0.59): Marketers, event organizers, community leads, and other general Web3 professionals.
  6. BLANK / NON-WEB3 PROFILES (score 0.00 - 0.40): Reserved only for totally empty or irrelevant entries.

SCORING WEIGHTS:
  D1 GENERAL ROLE COMPATIBILITY (35% weight): e.g., Investor to any Founder, Developer to any Project, Service provider to startup.
  D2 DOMAIN & TOPIC SYNERGY (35% weight): e.g., DePIN, ZK, AI, DeFi, RWA, EVM, Sol.
  D3 COLLABORATION POTENTIAL (30% weight): Ecosystem growth, co-marketing, hiring, advisory, legal protection.

ABSOLUTE RULE — EXPLANATION TEXT:
Copy VERBATIM fragments from the input Role/Mandate fields only. Do NOT add or synthesize any word, name, or chain not present character-for-character in the input text.
Format: "[verbatim fragment of candidate mandate/role] aligns with [verbatim fragment of target mandate/role]"

OUTPUT: Return ONLY valid JSON. No markdown, no prose outside JSON.`

// ── Build user prompt ────────────────────────────────────────────────────
function buildPrompt(me: Profile, candidates: Profile[], limit: number): string {
  const list = candidates
    .map((c, i) => [
      `[${i + 1}] ID: ${c.id}`,
      `    Role: ${trim(c.role, 80)}`,
      `    Mandate: ${trim(c.mandate)}`,
    ].join('\n'))
    .join('\n\n')

  return `Analyze these ${candidates.length} pre-filtered candidates and select the TOP ${limit} matches for the TARGET under the conference synergy guidelines.

TARGET PROFILE:
  Role: ${me.role ?? 'N/A'}
  Mandate: ${me.mandate}

CANDIDATE POOL:
${list}

INSTRUCTIONS:
Score ALL ${candidates.length} candidates. Return up to ${limit} with similarity >= 0.60, sorted by similarity descending.
If fewer than ${limit} candidates reach 0.60, return only those that do — do not pad with weak matches.

For each match, write one sentence explaining the exact overlap using ONLY verbatim words/fragments that appear in the candidate's and target's Role/Mandate fields:
  "[verbatim fragment of candidate mandate/role] aligns with [verbatim fragment of target mandate/role]"
Do not introduce any word not present in the input text.

Return ONLY this JSON, no other text:
{"matches":[{"id":"<candidate uuid>","similarity":<float 0-1>,"explanation":"<one sentence>"}]}`
}

// ── Parse LLM JSON response ─────────────────────────────────────────────
function parseMatches(raw: string, limit: number): LLMMatchResult[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed?.matches)) return parsed.matches.slice(0, limit)
  } catch { /* fall through */ }

  const m = raw.match(/\{[\s\S]*\}/)
  if (m) {
    try {
      const parsed = JSON.parse(m[0])
      if (Array.isArray(parsed?.matches)) return parsed.matches.slice(0, limit)
    } catch { /* fall through */ }
  }

  const results: LLMMatchResult[] = []
  const objectRegex = /\{[^{}]+\}/g
  let objMatch: RegExpExecArray | null
  while ((objMatch = objectRegex.exec(raw)) !== null) {
    const objText = objMatch[0]
    const idM  = objText.match(/"id"\s*:\s*"([^"]+)"/)
    const simM = objText.match(/"similarity"\s*:\s*([0-9.]+)/)
    const expM = objText.match(/"explanation"\s*:\s*"([^"]*)"?/)
    if (idM && simM) {
      results.push({
        id: idM[1],
        similarity: parseFloat(simM[1]),
        explanation: expM ? expM[1] : '',
      })
    }
  }

  if (results.length > 0) return results.slice(0, limit)
  console.warn('[llm] Could not parse matches from response:', raw)
  return []
}

// ═══════════════════════════════════════════════════════════════════════════
//  PROVIDER: CLAUDE (Anthropic) — PRIMARY
// ═══════════════════════════════════════════════════════════════════════════

async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('CLAUDE_API_KEY or ANTHROPIC_API_KEY is not set')

  return enqueue('claude', async () => {
    await waitForRateLimitSlot('claude')

    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type':     'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key':         apiKey,
      },
      body: JSON.stringify({
        model:      ANTHROPIC_MODEL,
        max_tokens: 1024,
        temperature: 0,
        top_p:      1,
        top_k:      5,
        system:     [{ type: 'text', text: SYSTEM_PROMPT }],
        messages:   [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText)
      throw new Error(`Claude ${res.status}: ${errText}`)
    }

    const json: any = await res.json()
    // Claude returns content as an array of content blocks
    const content = json?.content
    if (!content) throw new Error('Claude returned empty response')

    // Extract text from content blocks
    const textBlock = Array.isArray(content)
      ? content.find((b: any) => b.type === 'text')
      : content
    return textBlock?.text ?? ''
  })
}

// ═══════════════════════════════════════════════════════════════════════════
//  PROVIDER: CEREBRAS — BACKUP
// ═══════════════════════════════════════════════════════════════════════════

async function callCerebras(prompt: string, modelName: string): Promise<string> {
  const apiKey = process.env.CEREBRAS_API_KEY
  if (!apiKey) throw new Error('CEREBRAS_API_KEY is not set')

  return enqueue('cerebras', async () => {
    await waitForRateLimitSlot('cerebras')

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
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: prompt },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText)
      throw new Error(`Cerebras ${res.status}: ${errText}`)
    }

    const json: any = await res.json()
    return json?.choices?.[0]?.message?.content ?? ''
  })
}

// ═══════════════════════════════════════════════════════════════════════════
//  UNIFIED MATCH FUNCTION — Claude primary, Cerebras fallback
// ═══════════════════════════════════════════════════════════════════════════

/**
 * getMatches
 *
 * Groups candidates into batches of 100.
 * Tries Claude first. If Claude fails, falls back to Cerebras
 * (with its internal fallback chain: gpt-oss-120b → llama-3.1-70b → llama-3.1-8b).
 */
export async function getMatches(
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
    const batch = batches[i]
    const prompt = buildPrompt(me, batch, limit)
    let raw = ''
    let success = false
    const errors: string[] = []

    // ── Primary: Claude ────────────────────────────────────────────────
    try {
      console.log(`[llm] Batch ${i + 1}/${batches.length} — calling Claude...`)
      raw = await callClaude(prompt)
      success = true
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.warn(`[llm] Claude failed: ${errMsg}`)
      errors.push(`Claude: ${errMsg}`)
    }

    // ── Fallback: Cerebras (with model fallback chain) ─────────────────
    if (!success) {
      const cerebrasModels = [CEREBRAS_MODEL, 'llama-3.1-70b', 'llama-3.1-8b']
      for (const model of cerebrasModels) {
        try {
          console.log(`[llm] Batch ${i + 1}/${batches.length} — falling back to Cerebras (${model})...`)
          raw = await callCerebras(prompt, model)
          success = true
          break
        } catch (err: any) {
          const errMsg = err instanceof Error ? err.message : String(err)
          console.warn(`[llm] Cerebras ${model} failed: ${errMsg}`)
          errors.push(`Cerebras ${model}: ${errMsg}`)
        }
      }
    }

    if (success) {
      const results = parseMatches(raw, limit)
      allResults.push(...results)
      console.log(`[llm] Batch ${i + 1}/${batches.length} → ${results.length} matches`)
    } else {
      console.error(`[llm] All providers failed for batch ${i + 1}/${batches.length}. Errors:`, errors)
    }
  }

  return allResults
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}

// ═══════════════════════════════════════════════════════════════════════════
//  LEGACY EXPORT — for backwards compatibility if other files import it
// ═══════════════════════════════════════════════════════════════════════════

/** @deprecated Use getMatches() instead — Claude primary, Cerebras fallback */
export async function getCerebrasMatches(
  me:         Profile,
  candidates: Profile[],
  limit:      number,
): Promise<LLMMatchResult[]> {
  return getMatches(me, candidates, limit)
}