/**
 * Add random Telegram usernames to all attendees
 */

import { createServerClient } from '../lib/supabase'

// Generate random Telegram-style usernames
function generateTelegramUsername(): string {
  const adjectives = ['crypto', 'web3', 'defi', 'nft', 'dao', 'smart', 'chain', 'block', 'token', 'vault', 'stake', 'yield', 'swap', 'mint', 'burn']
  const nouns = ['dev', 'trader', 'builder', 'hodler', 'whale', 'ape', 'degen', 'maxi', 'node', 'validator', 'oracle', 'bridge', 'pool', 'farm', 'vault']
  const numbers = Math.floor(Math.random() * 9000) + 1000

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  
  return `@${adj}_${noun}_${numbers}`
}

async function addTelegramLinks() {
  const supabase = createServerClient()

  console.log('Fetching all attendees...')
  
  const { data: attendees, error } = await supabase
    .from('attendees')
    .select('id, name, telegram_username')

  if (error) {
    console.error('Error fetching attendees:', error)
    return
  }

  if (!attendees || attendees.length === 0) {
    console.log('No attendees found')
    return
  }

  console.log(`Found ${attendees.length} attendees`)

  let updated = 0
  let skipped = 0

  for (const attendee of attendees) {
    // Skip if already has a telegram username
    if (attendee.telegram_username) {
      console.log(`⊘ Skipped ${attendee.name} (already has TG: ${attendee.telegram_username})`)
      skipped++
      continue
    }

    const telegramUsername = generateTelegramUsername()
    
    const { error: updateError } = await supabase
      .from('attendees')
      .update({ telegram_username: telegramUsername })
      .eq('id', attendee.id)

    if (updateError) {
      console.error(`✗ Error updating ${attendee.name}:`, updateError)
    } else {
      console.log(`✓ Added TG for ${attendee.name}: ${telegramUsername}`)
      updated++
    }
  }

  console.log(`\n✓ Successfully added Telegram links to ${updated} attendees`)
  console.log(`⊘ Skipped ${skipped} attendees (already had TG links)`)
}

addTelegramLinks().catch(console.error)
