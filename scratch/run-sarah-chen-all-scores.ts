import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import fs from 'fs'
import path from 'path'

const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions'
const MODEL = 'gpt-oss-120b'

async function run() {
  const filePath = path.join(process.cwd(), 'test_profiles.json')
  if (!fs.existsSync(filePath)) {
    console.error('test_profiles.json not found!')
    return
  }

  const profiles = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const sarah = profiles.find((p: any) => p.name === 'Sarah Chen')
  const candidates = profiles.filter((p: any) => p.name !== 'Sarah Chen')

  const targetText = `Role: ${sarah.role}\nMandate: ${sarah.mandate}`

  const list = candidates
    .map((c: any, i: number) => `Candidate [${i + 1}]:\n  Name: ${c.name}\n  Role: ${c.role}\n  Mandate: ${c.mandate}`)
    .join('\n\n')

  const prompt = `You are a precision Web3 matchmaking engine. Score ALL 30 candidates below against the target: Sarah Chen.

TARGET PROFILE:
${targetText}

CANDIDATE POOL:
${list}

INSTRUCTIONS:
Assign an exact similarity score from 0.00 to 1.00 for EVERY SINGLE one of the 30 candidates based on their synergy with the target (Sarah Chen).
Do not omit any candidate. You must return exactly 30 entries in the output array.

Return ONLY a valid JSON object matching this schema:
{
  "scores": [
    {
      "name": "<candidate name>",
      "score": <float between 0.00 and 1.00>,
      "explanation": "<one sentence verbatim fragments explanation or alignment detail>"
    }
  ]
}`

  console.log('Sending all 30 profiles to Cerebras for full evaluation...')

  const apiKey = process.env.CEREBRAS_API_KEY
  const res = await fetch(CEREBRAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: 'You are a precision matchmaking evaluator. You output pure JSON matching the requested schema.'
        },
        { role: 'user', content: prompt }
      ]
    })
  })

  if (!res.ok) {
    console.error('Fetch failed:', res.statusText)
    return
  }

  const json: any = await res.json()
  const content = json?.choices?.[0]?.message?.content ?? ''

  // Parse and save
  try {
    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || content)
    console.log('\nParsed scores successfully!')
    fs.writeFileSync(
      path.join(process.cwd(), 'scratch', 'sarah-chen-all-scores.json'),
      JSON.stringify(parsed, null, 2)
    )
    console.log('Saved all scores to scratch/sarah-chen-all-scores.json')
  } catch (err) {
    console.error('Could not parse response JSON. Raw response content was:')
    console.log(content)
  }
}

run()
