import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { createClient } from '@supabase/supabase-js'
import { getCerebrasMatches } from '../lib/llm'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function run() {
  console.log('Fetching attendees from Supabase...')
  const { data: attendees, error } = await supabase
    .from('attendees')
    .select('id, name, role, mandate')

  if (error || !attendees || attendees.length === 0) {
    console.error('Failed to fetch attendees:', error)
    return
  }

  const sarah = attendees.find((a: any) => a.name === 'Sarah Chen')
  if (!sarah) {
    console.error('Sarah Chen not found in database!')
    return
  }

  const target = {
    id: sarah.id,
    name: sarah.name,
    role: sarah.role,
    mandate: sarah.mandate
  }

  const candidates = attendees
    .filter((a: any) => a.name !== 'Sarah Chen')
    .map((a: any) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      mandate: a.mandate
    }))

  console.log(`Matching target ${target.name} against ${candidates.length} DB candidates...`)

  try {
    const results = await getCerebrasMatches(target, candidates, 20)
    console.log('\n--- REAL MATCH RESULTS ---')
    console.log(JSON.stringify(results, null, 2))
  } catch (err) {
    console.error('Error calculating matches:', err)
  }
}

run()
