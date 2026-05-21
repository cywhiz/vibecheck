import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { createClient } from '@supabase/supabase-js'
import { getCerebrasMatches } from '../lib/llm'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

  console.log('Calling getCerebrasMatches...')
  const results = await getCerebrasMatches(me, candidates, 10)
  console.log('Results:', JSON.stringify(results, null, 2))
}

test()
