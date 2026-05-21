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
  const [attesting,   setAttesting]   = useState(false)
  const [attested,    setAttested]    = useState(!!match.attestation_id)
  const [attestUrl,   setAttestUrl]   = useState<string | null>(
    match.attestation_id ? getAttestationUrl(match.attestation_id) : null
  )
  const [attestError, setAttestError] = useState<string | null>(null)

  const scorePercent = Math.round(match.similarity * 100)
  const isHigh = scorePercent >= 85
  const isMid  = scorePercent >= 70

  const scoreColor  = isHigh ? 'text-brand-teal' : isMid ? 'text-brand-purple' : 'text-yellow-400'
  const barColor    = isHigh ? 'bg-brand-teal' : isMid ? 'bg-brand-purple' : 'bg-yellow-400'
  const glowColor   = isHigh ? 'shadow-glow-teal' : 'shadow-glow-purple'
  const borderHover = isHigh ? 'hover:border-brand-teal/40' : 'hover:border-brand-purple/40'

  async function handleConnect() {
    setAttesting(true)
    setAttestError(null)
    try {
      const res = await fetch('/api/attest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: currentUserId, toId: match.id, matchScore: match.similarity }),
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: 'easeOut' }}
      className={`relative bg-brand-card border border-brand-border rounded-2xl p-5
                  transition-all duration-300 group card-glow ${borderHover}`}
    >
      {/* Score badge — top-right */}
      <div className={`absolute top-4 right-4 text-right`}>
        <p className={`text-2xl font-bold font-mono ${scoreColor} leading-none`}>{scorePercent}%</p>
        <p className="text-gray-600 text-[10px] uppercase tracking-widest">match</p>
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-3 pr-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(match.name)}&backgroundColor=b6d9f2`}
          alt={match.name}
          width={40}
          height={40}
          className="rounded-full bg-brand-purple/20 flex-shrink-0 ring-1 ring-brand-purple/20"
          loading="lazy"
        />
        <div className="min-w-0">
          <p className="text-white font-semibold leading-tight truncate">{match.name}</p>
          {match.role && (
            <p className="text-gray-500 text-xs leading-tight mt-0.5 truncate">{match.role}</p>
          )}
        </div>
      </div>

      {/* Animated score bar */}
      <div className="w-full bg-brand-border rounded-full h-1 mb-4 overflow-hidden">
        <motion.div
          className={`h-1 rounded-full ${isHigh ? 'score-shimmer' : barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${scorePercent}%` }}
          transition={{ delay: index * 0.08 + 0.25, duration: 0.7, ease: 'easeOut' }}
        />
      </div>

      {/* Mandate */}
      <p className="text-gray-400 text-sm leading-relaxed mb-3 line-clamp-2">{match.mandate}</p>

      {/* AI explanation */}
      {match.explanation && (
        <div className="bg-brand-purple/8 border border-brand-purple/15 rounded-xl px-3 py-2.5 mb-4">
          <p className="text-brand-purple text-[10px] font-semibold uppercase tracking-widest mb-1">✦ AI says</p>
          <p className="text-gray-300 text-sm leading-relaxed">{match.explanation}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {match.telegram_username && (
          <a
            href={`https://t.me/${match.telegram_username.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-[#24A1DE]/10 border border-[#24A1DE]/25
                       text-[#24A1DE] text-sm font-medium rounded-xl py-2.5
                       hover:bg-[#24A1DE]/20 transition-colors"
          >
            Telegram ↗
          </a>
        )}

        <AnimatePresence mode="wait">
          {attested ? (
            <motion.a
              key="attested"
              href={attestUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex-1 text-center bg-brand-teal/10 border border-brand-teal/35
                         text-brand-teal text-sm font-medium rounded-xl py-2.5
                         hover:bg-brand-teal/20 transition-colors ${glowColor}`}
            >
              ✓ On-chain ↗
            </motion.a>
          ) : (
            <motion.button
              key="connect"
              onClick={handleConnect}
              disabled={attesting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-brand-teal/10 border border-brand-teal/25 text-brand-teal
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
