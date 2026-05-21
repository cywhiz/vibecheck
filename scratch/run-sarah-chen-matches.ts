import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import fs from 'fs'
import path from 'path'
import { getCerebrasMatches } from '../lib/llm'

async function run() {
  const filePath = path.join(process.cwd(), 'test_profiles.json')
  if (!fs.existsSync(filePath)) {
    console.error('test_profiles.json not found!')
    return
  }

  const profiles = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const sarah = profiles.find((p: any) => p.name === 'Sarah Chen')
  if (!sarah) {
    console.error('Sarah Chen not found in test_profiles.json!')
    return
  }

  // Format profiles to match Profile type
  const target = {
    id: 'sarah-chen-id',
    name: sarah.name,
    role: sarah.role,
    mandate: sarah.mandate
  }

  const candidates = profiles
    .filter((p: any) => p.name !== 'Sarah Chen')
    .map((p: any, i: number) => ({
      id: `candidate-${i}`,
      name: p.name,
      role: p.role,
      mandate: p.mandate
    }))

  console.log(`Matching all 30 profiles against Target: ${target.name}...\n`)

  try {
    // Run the full pool. getCerebrasMatches uses BATCH_SIZE (100) so it'll run all 30 in a single sequential query.
    // Let's request all 30 matches (limit = 30)
    const results = await getCerebrasMatches(target, candidates, 30)

    console.log('--- RESULTS ---')
    console.log(JSON.stringify(results, null, 2))

    // Let's also save this to a json file for the caller or markdown output
    fs.writeFileSync(
      path.join(process.cwd(), 'scratch', 'sarah-chen-match-results.json'),
      JSON.stringify({ target, results }, null, 2)
    )
    console.log('\nSaved results to scratch/sarah-chen-match-results.json')
  } catch (err) {
    console.error('Error matching:', err)
  }
}

run()
