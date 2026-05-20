import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { getCerebrasMatches } from '@/lib/llm'
import type { AttendeeMatch } from '@/lib/supabase'
import { rankCandidates } from '@/lib/tfidf'

const MatchSchema = z.object({
  attendeeId:      z.string().uuid(),
  limit:           z.number().int().min(1).max(10).optional().default(10),
  matchThreshold:  z.number().min(0).max(1).optional().default(0.01),
  skipCache:       z.boolean().optional().default(false),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = MatchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { attendeeId, limit, skipCache } = parsed.data
    const supabase = createServerClient()

    // 1. Fetch the current attendee
    const { data: me, error: meError } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', attendeeId)
      .single()

    if (meError || !me) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })
    }

    // 2. Return cached matches if available, not stale, and has enough items
    if (!skipCache && me.match_cache && Object.keys(me.match_cache).length > 0) {
      const cache = me.match_cache as { matches?: AttendeeMatch[]; cachedAt?: number }
      const CACHE_TTL_MS = 30 * 60 * 1000  // 30 minutes
      if (
        cache.cachedAt && 
        Date.now() - cache.cachedAt < CACHE_TTL_MS && 
        cache.matches && 
        cache.matches.length >= limit
      ) {
        return NextResponse.json({ matches: cache.matches.slice(0, limit), fromCache: true })
      }
    }

    // 3. Fetch all other candidates
    const { data: candidates, error: candidatesError } = await supabase
      .from('attendees')
      .select('id, name, role, mandate, telegram_username, wallet_address')
      .neq('id', attendeeId)

    if (candidatesError || !candidates) {
      console.error('[match] Candidates fetch error:', candidatesError)
      return NextResponse.json({ error: 'Failed to fetch match candidates' }, { status: 500 })
    }

    // 4. Stage 1: Fast local TF-IDF vector ranking (retrieve top 15 candidates from the 4000+ candidate pool)
    const rankedCandidates = rankCandidates(
      { role: me.role, mandate: me.mandate },
      candidates,
      15
    )

    const meProfile = {
      id: me.id,
      name: me.name,
      role: me.role,
      mandate: me.mandate,
    }

    // 5. Stage 2: Deep LLM Refinement & Explanations (only processes the top 15 candidates in 1 single batch)
    const llmResults = await getCerebrasMatches(meProfile, rankedCandidates, limit)

    // 5.5 Fetch all existing connections involving this user
    const { data: connections } = await supabase
      .from('connections')
      .select('id, from_id, to_id, attestation_id')
      .or(`from_id.eq.${attendeeId},to_id.eq.${attendeeId}`)

    const connMap = new Map<string, string>()
    if (connections) {
      for (const conn of connections) {
        if (conn.attestation_id) {
          const partnerId = conn.from_id === attendeeId ? conn.to_id : conn.from_id
          connMap.set(partnerId, conn.attestation_id)
        }
      }
    }

    // 6. Enrich the matches with candidate profiles and existing attestation_ids
    const enriched: AttendeeMatch[] = llmResults
      .map((res) => {
        const candidate = candidates.find((c) => c.id === res.id)
        if (!candidate) return null
        const matchItem: AttendeeMatch = {
          id: candidate.id,
          name: candidate.name,
          role: candidate.role,
          mandate: candidate.mandate,
          telegram_username: candidate.telegram_username,
          wallet_address: candidate.wallet_address,
          similarity: res.similarity,
          explanation: res.explanation,
          attestation_id: connMap.get(candidate.id) || null,
        }
        return matchItem
      })
      .filter((m): m is AttendeeMatch => m !== null && m.similarity >= 0.70)

    // 7. Cache results in Supabase for next request
    await supabase
      .from('attendees')
      .update({ match_cache: { matches: enriched, cachedAt: Date.now() } })
      .eq('id', attendeeId)

    return NextResponse.json({ matches: enriched, fromCache: false })
  } catch (err) {
    console.error('[match] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
