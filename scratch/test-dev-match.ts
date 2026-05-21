import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { createClient } from '@supabase/supabase-js'

// Let's copy-paste callCerebras and buildPrompt here to see exactly what is happening
const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions'
const MODEL = 'gpt-oss-120b'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MAX_MANDATE_CHARS = 220
function trim(text: string | null | undefined, max = MAX_MANDATE_CHARS): string {
  if (!text) return 'N/A'
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

function buildPrompt(me: any, candidates: any[], limit: number): string {
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
Score ALL ${candidates.length} candidates. Return up to ${limit} with similarity >= 0.70, sorted by similarity descending.
If fewer than ${limit} candidates reach 0.70, return only those that do — do not pad with weak matches.

For each match, write one sentence using ONLY verbatim words from the Role/Mandate fields above:
  "[what candidate offers from their mandate/role]; [what target offers candidate back]."
Do not introduce any word not present in the input text.

Return ONLY this JSON, no other text:
{"matches":[{"id":"<candidate uuid>","similarity":<float 0-1>,"explanation":"<one sentence>"}]}`
}

async function test() {
  const { data: candidates } = await supabase
    .from('attendees')
    .select('id, name, role, mandate')
    .limit(20)

  if (!candidates || candidates.length === 0) {
    console.error('No candidates found in database!')
    return
  }

  const me = {
    id: 'test-user-dev',
    name: 'Sam',
    role: 'developer',
    mandate: 'Ethereum and Base experience, looking for developer roles or teams building on Base L2'
  }

  const prompt = buildPrompt(me, candidates, 10)
  console.log('--- PROMPT ---')
  console.log(prompt)

  const apiKey = process.env.CEREBRAS_API_KEY
  const res = await fetch(CEREBRAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       MODEL,
      stream:      false,
      temperature: 0,
      top_p:       1,
      messages: [
        {
          role:    'system',
          content: `You are a precision matchmaking engine for a Web3 networking event. Your job is to rank candidates by how much mutual value they can create with the target.

SCORING RUBRIC — evaluate each pair on:
  D1 NEED↔OFFER (40% weight): Does candidate's role/mandate directly supply what target is seeking, AND vice versa? Both directions must have signal for high scores.
  D2 ROLE FIT (30% weight): Are the roles complementary? (investor↔founder, auditor↔builder, BD↔protocol, recruiter↔engineer). Two people with IDENTICAL roles score max 0.65 unless one explicitly seeks the other.
  D3 DOMAIN (20% weight): Same Web3 vertical? (DeFi, RWA, ZK, Gaming, AI×Crypto, Payments, L2, etc.)
  D4 SPECIFICITY (10% weight): Concrete overlapping details? (same chain, geography, funding stage, company mentioned by both)

SCORE THRESHOLDS:
  0.90–1.00 = explicit bidirectional need↔offer + complementary roles + same domain
  0.80–0.89 = strong role fit + clear single-direction benefit + same domain
  0.70–0.79 = good domain overlap + plausible collaboration angle
  Below 0.70 = weak — exclude entirely

ABSOLUTE RULE — EXPLANATION TEXT:
Copy VERBATIM fragments from the input Role/Mandate fields only. Do not add any brand name, chain, or technology not present character-for-character in the input.
Format: "[what candidate offers target from their mandate/role]; [what target offers candidate back]."

OUTPUT: Return ONLY valid JSON. No markdown, no prose outside JSON.`,
        },
        { role: 'user', content: prompt },
      ],
    }),
  })

  console.log('--- RESPONSE STATUS ---', res.status)
  const json: any = await res.json()
  const content = json?.choices?.[0]?.message?.content ?? ''
  console.log('--- RAW RESPONSE CONTENT ---')
  console.log(content)
}

test()
