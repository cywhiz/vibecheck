'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import type { AttendeeMatch } from '@/lib/supabase'

// SSR bypass — react-force-graph-2d uses browser APIs
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

type GraphNode = {
  id: string
  name: string
  role?: string | null
  color: string
  val: number
  __x?: number
  __y?: number
}

type GraphLink = { source: string; target: string }
type GraphData  = { nodes: GraphNode[]; links: GraphLink[] }

type Props = {
  currentUserId: string
  matches: AttendeeMatch[]
}

export function NetworkGraph({ currentUserId, matches }: Props) {
  const [attendees,   setAttendees]   = useState<any[]>([])
  const [dimensions,  setDimensions]  = useState({ w: 600, h: 420 })
  const [tooltip,     setTooltip]     = useState<{ name: string; role: string; x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase     = createClient()

  const matchIds = useMemo(() => new Set(matches.map(m => m.id)), [matches])

  // Compute graph nodes and links dynamically based on live attendees and matches
  const graphData = useMemo<GraphData>(() => {
    const nodes = attendees.map(a => nodeFromAttendee(a, currentUserId, matchIds))
    
    // Safety check: D3 will crash if links reference a node ID that is not loaded yet
    const attendeeIds = new Set(attendees.map(a => a.id))
    const links = matches
      .filter(m => attendeeIds.has(currentUserId) && attendeeIds.has(m.id))
      .map(m => ({ source: currentUserId, target: m.id }))
      
    return { nodes, links }
  }, [attendees, currentUserId, matches, matchIds])

  // Responsive sizing
  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ w: width, h: height })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Initial load + realtime subscription for attendees list
  useEffect(() => {
    supabase
      .from('attendees')
      .select('id, name, role')
      .then(({ data }) => {
        if (data) setAttendees(data)
      })

    // Realtime: add attendee when someone new joins
    const channel = supabase
      .channel('network-graph-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendees' },
        (payload) => {
          const newAttendee = payload.new as any
          setAttendees(prev => {
            if (prev.some(a => a.id === newAttendee.id)) return prev
            return [...prev, newAttendee]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, supabase])

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    if (!node) { setTooltip(null); return }
    setTooltip({
      name: node.name,
      role: node.role ?? '',
      x: node.__x ?? 0,
      y: node.__y ?? 0,
    })
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px]">
      <ForceGraph2D
        graphData={graphData}
        width={dimensions.w}
        height={dimensions.h}
        nodeLabel=""                        // we handle tooltip manually
        nodeColor={(n) => (n as GraphNode).color}
        nodeVal={(n) => (n as GraphNode).val}
        linkColor={() => '#5DCAA5'}
        linkWidth={1.5}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleColor={() => '#7F77DD'}
        backgroundColor="transparent"
        onNodeHover={handleNodeHover as (node: object | null) => void}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as GraphNode & { x: number; y: number }
          n.__x = n.x
          n.__y = n.y
          const size    = n.val * 2
          const label   = n.name
          const fontSize = Math.max(10 / globalScale, 2)

          // Glow effect for current user
          if (n.id === currentUserId) {
            ctx.beginPath()
            ctx.arc(n.x, n.y, size + 4, 0, 2 * Math.PI)
            ctx.fillStyle = 'rgba(127, 119, 221, 0.2)'
            ctx.fill()
          }

          // Node circle
          ctx.beginPath()
          ctx.arc(n.x, n.y, size, 0, 2 * Math.PI)
          ctx.fillStyle = n.color
          ctx.fill()

          // Label (only if zoomed in enough)
          if (globalScale > 1.2 || n.id === currentUserId || matchIds.has(n.id)) {
            ctx.font         = `${n.id === currentUserId ? 'bold ' : ''}${fontSize}px Inter,sans-serif`
            ctx.fillStyle    = n.id === currentUserId ? '#fff' : '#ccc'
            ctx.textAlign    = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, n.x, n.y + size + fontSize)
          }
        }}
        cooldownTicks={80}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute bg-brand-card border border-brand-border
                     rounded-xl px-3 py-2 text-sm shadow-xl z-10 max-w-[200px]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="text-white font-semibold">{tooltip.name}</p>
          {tooltip.role && <p className="text-gray-500 text-xs mt-0.5">{tooltip.role}</p>}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-purple inline-block" /> You
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-teal inline-block" /> Your matches
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-500 inline-block" /> Attendees
        </div>
      </div>
    </div>
  )
}

function nodeFromAttendee(
  a: { id: string; name: string; role?: string | null },
  currentUserId: string,
  matchIds: Set<string>
): GraphNode & { fx?: number; fy?: number } {
  const isMe    = a.id === currentUserId
  const isMatch = matchIds.has(a.id)
  return {
    id:    a.id,
    name:  a.name,
    role:  a.role,
    color: isMe    ? '#7F77DD' :
           isMatch ? '#1D9E75' :
                     '#484860',
    val:   isMe ? 8 : isMatch ? 5 : 2,
    ...(isMe ? { fx: 0, fy: 0 } : {}) // Pin current user to the exact center (0,0)
  }
}
