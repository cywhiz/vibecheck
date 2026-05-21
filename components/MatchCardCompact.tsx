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

export function MatchCardCompact({ match, currentUserId, index }: Props) {
  const [attesting,   setAttesting]   = useState(false)
  const [attested,    setAttested]    = useState(!!match.attestation_id)
  const [attestUrl,   setAttestUrl]   = useState<string | null>(
    match.attestation_id ? getAttestationUrl(match.attestation_id) : null
  )
  const [attestError, setAttestError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const scorePercent = Math.round(match.similarity * 100)
  const isHigh = scorePercent >= 85
  const isMid  = scorePercent >= 70

  const scoreColor  = isHigh ? 'text-brand-teal' : isMid ? 'text-brand-purple' : 'text-yellow-400'
  const glowColor   = isHigh ? 'shadow-glow-teal' : 'shadow-glow-purple'

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
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
        className="flex flex-col items-center gap-1.5"
      >
        {/* Avatar - clickable */}
        <button
          onClick={() => setShowDetails(true)}
          className="relative group w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(match.name)}&backgroundColor=b6d9f2`}
            alt={match.name}
            width={100}
            height={100}
            className="w-full aspect-square rounded-lg bg-brand-purple/20 ring-1 ring-brand-purple/30 group-hover:ring-brand-purple/60 transition-all object-cover"
          />
          <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
            <span className="text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              View
            </span>
          </div>
          {/* Score badge */}
          <div className={`absolute -top-2 -right-2`}>
            <p className={`text-lg font-bold font-mono ${scoreColor} leading-none bg-brand-dark rounded-full w-8 h-8 flex items-center justify-center border border-brand-border`}>
              {scorePercent}%
            </p>
          </div>
        </button>

        {/* Name */}
        <div className="text-center w-full min-h-[2rem]">
          <p className="text-white font-semibold text-[11px] line-clamp-2">{match.name}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-0.5 w-full">
          {match.telegram_username && (
            <a
              href={`https://t.me/${match.telegram_username.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-[#24A1DE]/10 border border-[#24A1DE]/25
                         text-[#24A1DE] text-sm font-medium rounded py-1
                         hover:bg-[#24A1DE]/20 transition-colors flex items-center justify-center"
              title="Message on Telegram"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.332-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.461c.54-.203 1.01.122.84.953z"/>
              </svg>
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
                           text-brand-teal text-sm font-medium rounded py-1
                           hover:bg-brand-teal/20 transition-colors flex items-center justify-center ${glowColor}`}
                title="View on-chain attestation"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </motion.a>
            ) : (
              <motion.button
                key="connect"
                onClick={handleConnect}
                disabled={attesting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-brand-teal/10 border border-brand-teal/25 text-brand-teal
                           text-sm font-medium rounded py-1 hover:bg-brand-teal/20
                           disabled:opacity-50 disabled:cursor-wait transition-colors flex items-center justify-center"
                title="Connect on-chain"
              >
                {attesting ? (
                  <span className="animate-spin w-4 h-4 border border-brand-teal/30 border-t-brand-teal rounded-full" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6-6 6 6M6 9v6a2 2 0 002 2h8a2 2 0 002-2V9M9 13h6M9 17h6"/>
                  </svg>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {attestError && (
          <p className="text-red-400 text-[8px] text-center">{attestError}</p>
        )}
      </motion.div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-card border border-brand-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Close button */}
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>

              {/* Header with avatar and score side-by-side */}
              <div className="flex gap-6 mb-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(match.name)}&backgroundColor=b6d9f2`}
                    alt={match.name}
                    width={140}
                    height={140}
                    className="rounded-full bg-brand-purple/20 ring-2 ring-brand-purple/30"
                  />
                </div>

                {/* Name, role, and score */}
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-white font-semibold text-2xl mb-1">{match.name}</p>
                  {match.role && (
                    <p className="text-gray-400 text-sm mb-4">{match.role}</p>
                  )}
                  
                  {/* Match score */}
                  <div className="flex items-baseline gap-2">
                    <p className={`text-4xl font-bold font-mono ${scoreColor}`}>{scorePercent}%</p>
                    <p className="text-gray-500 text-xs uppercase tracking-widest">match</p>
                  </div>
                </div>
              </div>

              {/* Mandate */}
              <div className="mb-5">
                <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold mb-2">Mandate</p>
                <p className="text-gray-300 text-sm leading-relaxed">{match.mandate}</p>
              </div>

              {/* AI explanation */}
              {match.explanation && (
                <div className="bg-brand-purple/8 border border-brand-purple/15 rounded-xl px-4 py-3 mb-6">
                  <p className="text-brand-purple text-xs font-semibold uppercase tracking-widest mb-2">✦ Why you match</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{match.explanation}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                {match.telegram_username && (
                  <a
                    href={`https://t.me/${match.telegram_username.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-[#24A1DE]/10 border border-[#24A1DE]/25
                               text-[#24A1DE] text-sm font-medium rounded-xl py-3
                               hover:bg-[#24A1DE]/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.332-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.461c.54-.203 1.01.122.84.953z"/>
                    </svg>
                    Telegram
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
                                 text-brand-teal text-sm font-medium rounded-xl py-3
                                 hover:bg-brand-teal/20 transition-colors flex items-center justify-center gap-2 ${glowColor}`}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      On-chain
                    </motion.a>
                  ) : (
                    <motion.button
                      key="connect"
                      onClick={handleConnect}
                      disabled={attesting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-brand-teal/10 border border-brand-teal/25 text-brand-teal
                                 text-sm font-medium rounded-xl py-3 hover:bg-brand-teal/20
                                 disabled:opacity-50 disabled:cursor-wait transition-colors flex items-center justify-center gap-2"
                    >
                      {attesting ? (
                        <>
                          <span className="animate-spin w-4 h-4 border border-brand-teal/30 border-t-brand-teal rounded-full" />
                          Attesting…
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6-6 6 6M6 9v6a2 2 0 002 2h8a2 2 0 002-2V9M9 13h6M9 17h6"/>
                          </svg>
                          Connect On-Chain
                        </>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {attestError && (
                <p className="text-red-400 text-xs mt-3 text-center">{attestError}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
