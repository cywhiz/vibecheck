'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { NetworkGraph } from '@/components/NetworkGraph'
import { MatchCardCompact } from '@/components/MatchCardCompact'
import { MatchCardSkeleton } from '@/components/MatchCardSkeleton'
import { LiveFeed } from '@/components/LiveFeed'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { AttendeeMatch } from '@/lib/supabase'

type Attendee = { id: string; name: string; role: string | null; mandate: string }

function DashboardContent() {
  const params  = useSearchParams()
  const router  = useRouter()
  const id      = params.get('id')

  const [attendee,    setAttendee]    = useState<Attendee | null>(null)
  const [matches,     setMatches]     = useState<AttendeeMatch[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [refreshing,  setRefreshing]  = useState(false)
  const [fromCache,   setFromCache]   = useState(false)

  // Restore attendee from sessionStorage or URL param
  useEffect(() => {
    if (!id) { router.replace('/'); return }

    const stored = sessionStorage.getItem('vibecheck_attendee')
    if (stored) {
      try { setAttendee(JSON.parse(stored)) } catch { /* ignore */ }
    }

    fetchMatches(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function fetchMatches(attendeeId: string, force = false) {
    if (force) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId, skipCache: force, limit: 10 }),
      })

      if (!res.ok) throw new Error('Match fetch failed')

      const data = await res.json()
      setMatches(data.matches ?? [])
      setFromCache(data.fromCache ?? false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (!id) return null

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      {/* Top nav */}
      <nav className="border-b border-brand-border bg-brand-dark/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-white">
            Vibe<span className="text-brand-purple">Check</span>
          </a>

          <div className="flex items-center gap-3">
            {attendee && (
              <span className="text-gray-500 text-sm hidden sm:block truncate max-w-[200px]">
                {attendee.name}
              </span>
            )}
            <button
              onClick={() => id && fetchMatches(id, true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 bg-brand-card border border-brand-border
                         text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg
                         transition-colors disabled:opacity-50"
            >
              {refreshing ? (
                <span className="w-3.5 h-3.5 border border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
              ) : (
                <span>↻</span>
              )}
              Refresh
            </button>
            <a
              href="/"
              className="text-sm bg-brand-purple/10 border border-brand-purple/30 text-brand-purple
                         px-3 py-1.5 rounded-lg hover:bg-brand-purple/20 transition-colors"
            >
              + New profile
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Your mandate banner */}
        {attendee && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-card border border-brand-border rounded-2xl px-5 py-4 mb-6"
          >
            <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold mb-1">Your mandate</p>
            <p className="text-gray-300">{attendee.mandate}</p>
          </motion.div>
        )}

                {/* Main grid: graph + feed (70%) | matches (30%) - responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.43fr] gap-4">

          {/* Left — graph + live feed (70%) */}
          <div className="space-y-3 min-w-0 flex flex-col h-full">
            {/* Network graph */}
            <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden flex-1 min-h-0">
              <div className="px-3 py-2 border-b border-brand-border flex items-center justify-between">
                <h2 className="font-semibold text-white text-xs">Live Network</h2>
                <span className="flex items-center gap-1 text-[10px] text-brand-teal">
                  <span className="w-1 h-1 rounded-full bg-brand-teal animate-pulse-slow" />
                  Live
                </span>
              </div>
              <ErrorBoundary
                fallback={
                  <div className="flex items-center justify-center h-80 text-gray-500 text-xs">
                    Graph unavailable
                  </div>
                }
              >
                {matches.length > 0 || !loading ? (
                  <NetworkGraph currentUserId={id} matches={matches} />
                ) : (
                  <div className="flex items-center justify-center h-80">
                    <div className="w-6 h-6 border-2 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin" />
                  </div>
                )}
              </ErrorBoundary>
            </div>

            {/* Live feed */}
            <div className="min-w-0">
              <div className="bg-brand-card border border-brand-border rounded-2xl p-3">
                <h2 className="font-semibold text-white mb-2 text-xs">Live Activity</h2>
                <ErrorBoundary>
                  <LiveFeed />
                </ErrorBoundary>
              </div>
            </div>
          </div>

          {/* Right — match cards (30%, sticky) */}
          <div className="lg:sticky lg:top-20 lg:self-start min-w-0">
            {/* Match cards */}
            <div className="min-w-0">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h2 className="font-semibold text-white text-sm flex items-center gap-1 truncate">
                  Top Matches
                  {fromCache && !loading && (
                    <span className="text-[9px] font-normal bg-brand-teal/10 border border-brand-teal/30
                                     text-brand-teal px-1.5 py-0.5 rounded-full flex-shrink-0">
                      ⚡
                    </span>
                  )}
                </h2>
                {error && (
                  <button
                    onClick={() => id && fetchMatches(id, true)}
                    className="text-xs text-brand-purple hover:underline flex-shrink-0"
                  >
                    Retry
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2 text-center mb-3">
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 max-h-[600px] overflow-y-auto pr-2">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-brand-card border border-brand-border rounded-lg animate-pulse" />
                    ))
                  : matches.map((m, i) => (
                      <MatchCardCompact
                        key={m.id}
                        match={m}
                        currentUserId={id}
                        index={i}
                      />
                    ))
                }
                {!loading && matches.length === 0 && !error && (
                  <div className="col-span-3 text-center py-6 text-gray-500">
                    <p className="text-xs mb-1">No matches yet</p>
                    <p className="text-[10px]">Check back soon.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// Wrap in Suspense because useSearchParams requires it in Next 14 App Router
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
