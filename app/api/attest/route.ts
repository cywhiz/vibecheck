import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { attestConnection, getAttestationUrl } from '@/lib/sign-protocol'

const AttestSchema = z.object({
  fromId:       z.string().uuid(),
  toId:         z.string().uuid(),
  matchScore:   z.number().min(0).max(1),
  fromAddress:  z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  toAddress:    z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
})

// Demo wallet used when attendees haven't connected a real wallet
const DEMO_FROM = '0x0000000000000000000000000000000000000001'
const DEMO_TO   = '0x0000000000000000000000000000000000000002'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = AttestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { fromId, toId, matchScore, fromAddress, toAddress } = parsed.data
    const supabase = createServerClient()

    // 1. Check for duplicate connection
    const { data: existing } = await supabase
      .from('connections')
      .select('id, attestation_id')
      .eq('from_id', fromId)
      .eq('to_id', toId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        message: 'Connection already exists',
        attestationId: existing.attestation_id,
        url: existing.attestation_id ? getAttestationUrl(existing.attestation_id) : null,
        duplicate: true,
      })
    }

    // 2. Resolve wallet addresses from DB if not provided
    let resolvedFrom = fromAddress
    let resolvedTo   = toAddress

    if (!resolvedFrom || !resolvedTo) {
      const { data: attendees } = await supabase
        .from('attendees')
        .select('id, wallet_address')
        .in('id', [fromId, toId])

      const fromAttendee = attendees?.find(a => a.id === fromId)
      const toAttendee   = attendees?.find(a => a.id === toId)

      resolvedFrom = fromAttendee?.wallet_address ?? DEMO_FROM
      resolvedTo   = toAttendee?.wallet_address   ?? DEMO_TO
    }

    // 3. Create on-chain attestation via Sign Protocol
    const eventName = process.env.NEXT_PUBLIC_EVENT_NAME ?? 'SEABW 2026'
    const { attestationId, txHash } = await attestConnection(
      resolvedFrom,
      resolvedTo,
      matchScore,
      eventName
    )

    // 4. Persist connection record in Supabase
    const { data: connection, error } = await supabase
      .from('connections')
      .insert({
        from_id:       fromId,
        to_id:         toId,
        match_score:   matchScore,
        attestation_id: attestationId,
        tx_hash:       txHash ?? null,
        event_name:    eventName,
      })
      .select()
      .single()

    if (error) {
      console.error('[attest] DB insert error:', error)
      // Don't fail — attestation was created, just log it
    }

    return NextResponse.json({
      attestationId,
      txHash,
      url: getAttestationUrl(attestationId),
      connection,
    })
  } catch (err) {
    console.error('[attest] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
