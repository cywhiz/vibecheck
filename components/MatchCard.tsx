'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AttendeeMatch } from '@/lib/supabase'
import { getAttestationUrl } from '@/lib/sign-protocol'

type Props = {
  match: AttendeeMatch
  currentUserId: string
  index: number
}

export function MatchCard({ match, currentUserId, index }: Props) {
  const [attesting,    setAttesting]    = useState(false)
  const [attested,     setAttested]     = useState(!!match.attestation_id)
  const [attestUrl,    setAttestUrl]    = useState<string | null>(
    match.attestation_id ? getAttestationUrl(match.attestation_id) : null
  )
  const [attestError,  setAttestError]  = useState<string | null>(null)

  const scorePercent = Math.round(match.similarity * 100)

  async function handleConnect() {
    setAttesting(true)
    setAttestError(null)

    try {
      const res = await fetch('/api/attest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromId: currentUserId,
          toId: match.id,
          matchScore: match.similarity,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Attestation failed')

      setAttestUrl(data.url)
      setAttested(true)
    } catch (err) {
      setAttestError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setAttesting(false)
    }
  }

  // Gradient colour based on match score
  const scoreColor =
    scorePercent >= 85 ? 'text-brand-teal' :
    scorePercent >= 70 ? 'text-brand-purple' :
    'text-yellow-400'

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.12, duration: 0.35 }}
      className="bg-brand-card border border-brand-border rounded-2xl p-5
                 hover:border-brand-purple/40 transition-colors group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar — dicebear deterministic from name */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(match.name)}&backgroundColor=7F77DD`}
            alt={match.name}
            width={44}
            height={44}
            className="rounded-full bg-brand-purple/20 flex-shrink-0"
          />
          <div>
            <p className="text-white font-semibold leading-tight">{match.name}</p>
            {match.role && (
              <p className="text-gray-500 text-sm leading-tight mt-0.5">{match.role}</p>
            )}
          </div>
        </div>

        {/* Match score badge */}
        <div className="text-right flex-shrink-0">
          <p className={`text-2xl font-bold font-mono ${scoreColor}`}>{scorePercent}%</p>
          <p className="text-gray-600 text-xs">match</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full bg-brand-border rounded-full h-1 mb-4">
        <motion.div
          className={`h-1 rounded-full ${
            scorePercent >= 85 ? 'bg-brand-teal' :
            scorePercent >= 70 ? 'bg-brand-purple' :
            'bg-yellow-400'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${scorePercent}%` }}
          transition={{ delay: index * 0.12 + 0.3, duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Mandate */}
      <p className="text-gray-400 text-sm leading-relaxed mb-3 line-clamp-2">{match.mandate}</p>

      {/* AI explanation */}
      {match.explanation && (
        <div className="bg-brand-purple/10 border border-brand-purple/20 rounded-xl px-3 py-2 mb-4">
          <p className="text-brand-purple text-xs font-medium mb-0.5">✦ AI says</p>
          <p className="text-gray-300 text-sm italic">{match.explanation}</p>
        </div>
      )}


      {/* Action buttons */}
      <div className="flex gap-2">
        {/* Telegram */}
        {match.telegram_username && (
          <a
            href={`https://t.me/${match.telegram_username.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-[#24A1DE]/10 border border-[#24A1DE]/30
                       text-[#24A1DE] text-sm font-medium rounded-xl py-2.5
                       hover:bg-[#24A1DE]/20 transition-colors"
          >
            Telegram ↗
          </a>
        )}

        {/* On-chain Connect */}
        <AnimatePresence mode="wait">
          {attested ? (
            <motion.a
              key="attested"
              href={attestUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 text-center bg-brand-teal/10 border border-brand-teal/40
                         text-brand-teal text-sm font-medium rounded-xl py-2.5
                         hover:bg-brand-teal/20 transition-colors"
            >
              ✓ On-chain ↗
            </motion.a>
          ) : (
            <motion.button
              key="connect"
              onClick={handleConnect}
              disabled={attesting}
              className="flex-1 bg-brand-teal/10 border border-brand-teal/30 text-brand-teal
                         text-sm font-medium rounded-xl py-2.5 hover:bg-brand-teal/20
                         disabled:opacity-50 disabled:cursor-wait transition-colors"
            >
              {attesting ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="animate-spin w-3.5 h-3.5 border border-brand-teal/30 border-t-brand-teal rounded-full" />
                  Attesting…
                </span>
              ) : (
                'Connect On-Chain'
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {attestError && (
        <p className="text-red-400 text-xs mt-2 text-center">{attestError}</p>
      )}
    </motion.div>
  )
}
