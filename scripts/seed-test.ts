import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  const filePath = path.join(process.cwd(), 'test_profiles.json')
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Could not find ${filePath}`)
    process.exit(1)
  }

  const profiles = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  console.log(`\n🌱 Seeding ${profiles.length} test profiles directly into Supabase...\n`)

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i]
    process.stdout.write(`[${i + 1}/${profiles.length}] Inserting ${profile.name}... `)

    try {
      const { error } = await supabase
        .from('attendees')
        .insert({
          name: profile.name,
          role: profile.role,
          mandate: profile.mandate,
          telegram_username: null,
        })

      if (error) {
        console.log(`❌ Failed: ${error.message}`)
      } else {
        console.log(`✅ Success`)
      }
    } catch (e) {
      console.log(`❌ Error: ${e}`)
    }
  }

  console.log('\n🎉 Finished seeding test profiles!')
}

main()
