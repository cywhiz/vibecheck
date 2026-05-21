'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

type FeedItem = {
  id: string
  name: string
  role: string | null
  mandate: string
  ts: number
}

function formatTs(ts: number): string {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

export function LiveFeed() {
  const [items,         setItems]         = useState<FeedItem[]>([])
  const [connCount,     setConnCount]     = useState(0)
  const [attendeeCount, setAttendeeCount] = useState(0)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Load recent attendees and subscribe to new ones
  useEffect(() => {
    // Fetch last 5 for initial state
    supabase
      .from('attendees')
      .select('id, name, role, mandate, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) {
          setItems(
            data.map(a => ({ id: a.id, name: a.name, role: a.role, mandate: a.mandate, ts: Date.now() }))
          )
        }
      })

    // Fetch initial connection count
    supabase
      .rpc('count_connections')
      .then(({ data }) => { if (data !== null) setConnCount(data) })

    // Fetch initial attendee count
    supabase
      .from('attendees')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => { if (count !== null) setAttendeeCount(count) })

    // Realtime subscriptions
    const chan = supabase
      .channel('live-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendees' },
        (p) => {
          setAttendeeCount(c => c + 1)
          setItems(prev => [
            { id: p.new.id, name: p.new.name, role: p.new.role, mandate: p.new.mandate, ts: Date.now() },
            ...prev,
          ].slice(0, 8))
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'connections' },
        () => setConnCount(c => c + 1)
      )
      .subscribe()

    return () => { supabase.removeChannel(chan) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      {/* Dynamic side-by-side Counters */}
      <div className="grid grid-cols-2 gap-3">
        {/* Connection counter */}
        <motion.div 
          layout
          className="bg-brand-teal/5 border border-brand-teal/15 hover:border-brand-teal/35 rounded-xl px-3 py-3 flex items-center justify-between transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-8 h-8 bg-brand-teal/5 rounded-bl-full pointer-events-none" />
          <div>
            <p className="text-brand-teal font-extrabold text-2xl font-mono leading-none tracking-tight">{connCount}</p>
            <p className="text-gray-500 text-[10px] uppercase font-semibold tracking-wider mt-1.5">Attestations</p>
          </div>
          <span className="text-xl">⛓️</span>
        </motion.div>

        {/* Attendee counter */}
        <motion.div 
          layout
          className="bg-brand-purple/5 border border-brand-purple/15 hover:border-brand-purple/35 rounded-xl px-3 py-3 flex items-center justify-between transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-8 h-8 bg-brand-purple/5 rounded-bl-full pointer-events-none" />
          <div>
            <p className="text-brand-purple font-extrabold text-2xl font-mono leading-none tracking-tight">{attendeeCount}</p>
            <p className="text-gray-500 text-[10px] uppercase font-semibold tracking-wider mt-1.5">Attendees</p>
          </div>
          <span className="text-xl animate-pulse">👥</span>
        </motion.div>
      </div>

      {/* Attendee join feed */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-teal"></span>
          </span>
          Live Activity
        </p>
        <span className="text-[10px] text-gray-600 font-mono">Radar scanning...</span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id + item.ts}
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="bg-brand-card border border-brand-border hover:border-brand-border/60 rounded-xl px-3 py-2.5 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-teal flex-shrink-0 animate-pulse relative">
                  <span className="absolute inset-0 rounded-full bg-brand-teal/50 animate-ping opacity-60" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(item.name)}&backgroundColor=b6d9f2`}
                  alt={item.name}
                  width={32}
                  height={32}
                  className="rounded-full bg-brand-purple/20 flex-shrink-0 ring-1 ring-brand-purple/20"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-semibold truncate pr-1">{item.name}</p>
                    <span className="text-[9px] text-gray-600 font-mono">{formatTs(item.ts)}</span>
                  </div>
                  {item.role && (
                    <p className="text-gray-500 text-xs truncate mt-0.5">{item.role}</p>
                  )}
                  <p className="text-gray-400 text-xs truncate mt-1 italic border-l border-brand-border/40 pl-2">
                    {item.mandate}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

