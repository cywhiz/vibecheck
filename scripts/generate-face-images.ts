/**
 * Generate random face images for attendees using DiceBear API
 * and update the database with avatar URLs
 */

import { createServerClient } from '../lib/supabase'

async function generateFaceImages() {
  const supabase = createServerClient()

  console.log('Fetching all attendees...')
  
  const { data: attendees, error } = await supabase
    .from('attendees')
    .select('id, name, match_cache')
    .limit(50)

  if (error) {
    console.error('Error fetching attendees:', error)
    return
  }

  if (!attendees || attendees.length === 0) {
    console.log('No attendees found')
    return
  }

  console.log(`Found ${attendees.length} attendees`)

  // Generate face images using DiceBear API
  // Using the "avataaars" style for consistent cartoon-style avatars
  const updatedAttendees = []

  for (const attendee of attendees) {
    // DiceBear API URL format: https://api.dicebear.com/8.x/avataaars/svg?seed={name}
    const avatarUrl = `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(attendee.name)}&backgroundColor=b6d9f2`
    
    // Update the attendee record with avatar URL
    const { error: updateError } = await supabase
      .from('attendees')
      .update({ 
        match_cache: {
          avatar_url: avatarUrl,
          ...(attendee.match_cache ?? {})
        }
      })
      .eq('id', attendee.id)

    if (updateError) {
      console.error(`Error updating attendee ${attendee.name}:`, updateError)
    } else {
      console.log(`✓ Updated avatar for: ${attendee.name}`)
      updatedAttendees.push({ ...attendee, avatarUrl })
    }
  }

  console.log(`\nSuccessfully updated ${updatedAttendees.length} attendees with face images`)
  console.log('\nAvatar URLs generated:')
  updatedAttendees.forEach(a => console.log(`  - ${a.name}: ${a.avatarUrl}`))
}

generateFaceImages().catch(console.error)
