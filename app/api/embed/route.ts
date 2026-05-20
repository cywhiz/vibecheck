import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'

// ── Input validation ──────────────────────────────────────────────────────────
const EmbedSchema = z.object({
  name:     z.string().min(1).max(100),
  role:     z.string().max(200).optional().default(''),
  mandate:  z.string().min(10).max(1000),
  telegram: z.string().max(100).optional().default(''),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = EmbedSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, role, mandate, telegram } = parsed.data

    // Store attendee in Supabase (use service role to bypass RLS)
    const supabase = createServerClient()

    const { data: attendee, error } = await supabase
      .from('attendees')
      .insert({
        name,
        role,
        mandate,
        telegram_username: telegram || null,
      })
      .select('id, name, role, mandate, telegram_username, created_at')
      .single()


    if (error) {
      console.error('[embed] Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to store attendee' }, { status: 500 })
    }

    return NextResponse.json({ attendee }, { status: 201 })
  } catch (err) {
    console.error('[embed] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
