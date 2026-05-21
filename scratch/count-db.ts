import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function run() {
  const { count: attCount } = await supabase
    .from('attendees')
    .select('id', { count: 'exact', head: true })

  const { count: connCount } = await supabase
    .from('connections')
    .select('id', { count: 'exact', head: true })

  console.log(`--- DATABASE COUNT ---`)
  console.log(`Total Attendees:   ${attCount}`)
  console.log(`Total Connections: ${connCount}`)
}

run()
