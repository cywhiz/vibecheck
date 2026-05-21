'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import type { AttendeeMatch } from '@/lib/supabase'

// SSR bypass — react-force-graph-2d uses browser APIs
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

// ── Types ────────────────────────────────────────────────────────────────
type GraphNode = {
  id: string
  name: string
  role?: string | null
  color: string
  val: number
  score?: number        // 0–1 for matched attendees
  isMe?: boolean
  isMatch?: boolean
  tier?: 'high' | 'mid' | 'low' | 'none'  // visual tier
  avatarUrl?: string
  __x?: number
  __y?: number
}

type GraphLink = { source: string; target: string; score: number }
type GraphData  = { nodes: GraphNode[]; links: GraphLink[] }

type Props = {
  currentUserId: string
  matches: AttendeeMatch[]
}

// ── Constants ────────────────────────────────────────────────────────────
const MIN_MATCH_SCORE = 0.55   // below this → "other" node (small, dim)
const HIGH_TIER       = 0.80   // vibrant cyan + pulse
const MID_TIER        = 0.65   // purple, no pulse

// ── Score → smooth gradient color (teal → purple → slate) ───────────────
function scoreToColor(score: number): string {
  if (score >= 0.90) return '#00f2fe'   // bright cyan — elite
  if (score >= 0.80) return '#1D9E75'   // teal — strong
  if (score >= MID_TIER) return '#7F77DD' // purple — decent
  return '#484860'                        // muted — borderline
}

// ── Score → node radius (8–20px range for matches) ──────────────────────
function scoreToVal(score: number): number {
  // Linear interpolation: 0.55 → 10, 1.0 → 20
  const t = (score - MIN_MATCH_SCORE) / (1 - MIN_MATCH_SCORE)
  return 10 + t * 10
}

// ── Determine visual tier ───────────────────────────────────────────────
function getTier(score: number): 'high' | 'mid' | 'low' | 'none' {
  if (score >= HIGH_TIER) return 'high'
  if (score >= MID_TIER)  return 'mid'
  if (score >= MIN_MATCH_SCORE) return 'low'
  return 'none'
}

// ── Build a node from an attendee row ───────────────────────────────────
function nodeFromAttendee(
  a: { id: string; name: string; role?: string | null },
  currentUserId: string,
  scoreMap: Map<string, number>
): GraphNode & { fx?: number; fy?: number } {
  const isMe    = a.id === currentUserId
  const score   = scoreMap.get(a.id)
  const isMatch = score !== undefined && score >= MIN_MATCH_SCORE
  const tier    = score !== undefined ? getTier(score) : 'none'

  // Sizing: Me (biggest) → Matches (medium) → Others (smallest)
  const baseVal = isMe ? 28 : isMatch ? scoreToVal(score!) : 6

  return {
    id:      a.id,
    name:    a.name,
    role:    a.role,
    color:   isMe    ? '#7F77DD' :
             isMatch ? scoreToColor(score!) :
                       '#2A2A40',
    val:     baseVal,
    score,
    isMe,
    isMatch,
    tier:    isMatch ? getTier(score!) : 'none',
    // Avatar URL for face images
    avatarUrl: `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(a.name)}&backgroundColor=b6d9f2`,
    // Pin "Me" to origin
    ...(isMe ? { fx: 0, fy: 0 } : {}),
  }
}

export function NetworkGraph({ currentUserId, matches }: Props) {
  const [attendees,     setAttendees]     = useState<any[]>([])
  const [dimensions,    setDimensions]    = useState({ w: 600, h: 420 })
  const [tooltip,       setTooltip]       = useState<{
    name: string; role: string; score?: number; x: number; y: number
  } | null>(null)
  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const containerRef  = useRef<HTMLDivElement>(null)
  const graphRef      = useRef<any>(null)
  const supabase      = createClient()

  // Map: attendee id → match score
  const scoreMap = useMemo(() =>
    new Map(matches.map(m => [m.id, m.similarity])),
  [matches])

  // Build graph data — fully memoized
  const graphData = useMemo<GraphData>(() => {
    const nodes = attendees.map(a => nodeFromAttendee(a, currentUserId, scoreMap))
    const attendeeIds = new Set(attendees.map(a => a.id))
    
    // Only create links for matches (connected to "Me")
    const links: GraphLink[] = matches
      .filter(m => attendeeIds.has(currentUserId) && attendeeIds.has(m.id) && m.similarity >= MIN_MATCH_SCORE)
      .map(m => ({ source: currentUserId, target: m.id, score: m.similarity }))
    
    return { nodes, links }
  }, [attendees, currentUserId, matches, scoreMap])

  // ── Responsive sizing ──────────────────────────────────────────────────
  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ w: Math.max(width, 300), h: Math.max(height, 350) })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // ── Initial load + realtime subscription ───────────────────────────────
  useEffect(() => {
    supabase
      .from('attendees')
      .select('id, name, role')
      .then(({ data }) => { if (data) setAttendees(data) })

    const channel = supabase
      .channel('network-graph-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendees' },
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

  // ── Interaction handlers ───────────────────────────────────────────────
  const handleNodeClick = useCallback((node: object) => {
    const n = node as GraphNode
    setSelectedId(prev => prev === n.id ? null : n.id)
    setTooltip(null)
  }, [])

  const handleBackgroundClick = useCallback(() => {
    setSelectedId(null)
    setTooltip(null)
  }, [])

  const handleNodeHover = useCallback((node: object | null) => {
    if (!node) { setTooltip(null); return }
    const n = node as GraphNode & { x: number; y: number }
    if (!isFinite(n.x) || !isFinite(n.y)) return
    setTooltip({
      name:  n.name,
      role:  n.role ?? '',
      score: n.score,
      x:     n.x,
      y:     n.y,
    })
  }, [])

  // ── Highlight logic ────────────────────────────────────────────────────
  const isHighlighted = useCallback((nodeId: string): boolean => {
    if (!selectedId) return true
    if (nodeId === selectedId || nodeId === currentUserId) return true
    // Connected to selected?
    return graphData.links.some(l => {
      const src = typeof l.source === 'object' ? (l.source as any).id : l.source
      const tgt = typeof l.target === 'object' ? (l.target as any).id : l.target
      return (src === selectedId && tgt === nodeId) ||
             (tgt === selectedId && src === nodeId)
    })
  }, [selectedId, currentUserId, graphData.links])

  // ── Avatar image cache ───────────────────────────────────────────────────
const avatarCache = new Map<string, HTMLImageElement>()

function getAvatarImage(name: string): HTMLImageElement {
  const url = `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6d9f2`
  if (!avatarCache.has(url)) {
    const img = new Image()
    img.src = url
    avatarCache.set(url, img)
  }
  return avatarCache.get(url)!
}

// ── Custom node rendering ──────────────────────────────────────────────
  const drawNode = useCallback((node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const n = node as GraphNode & { x: number; y: number }

    if (!isFinite(n.x) || !isFinite(n.y)) return

    n.__x = n.x
    n.__y = n.y

    const size      = n.val * 1.2                // visual radius
    const dimmed    = !isHighlighted(n.id)
    const alpha     = dimmed ? 0.12 : 1
    const t         = (Date.now() % 2400) / 2400  // 0→1 loop for pulse

    ctx.globalAlpha = alpha

    // ── "Me" radial glow ───────────────────────────────────────────────
    if (n.isMe) {
      const grd = ctx.createRadialGradient(n.x, n.y, size * 0.5, n.x, n.y, size * 4)
      grd.addColorStop(0, 'rgba(127,119,221,0.35)')
      grd.addColorStop(0.6, 'rgba(127,119,221,0.12)')
      grd.addColorStop(1, 'rgba(127,119,221,0)')
      ctx.beginPath()
      ctx.arc(n.x, n.y, size * 4, 0, 2 * Math.PI)
      ctx.fillStyle = grd
      ctx.fill()
    }

    // ── Sonar pulse ring (only for high-tier matches) ──────────────────
    if (n.isMatch && n.tier === 'high' && !dimmed) {
      const pulseRadius = size + 2 + t * size * 2
      const pulseAlpha  = (1 - t) * 0.4

      ctx.beginPath()
      ctx.arc(n.x, n.y, pulseRadius, 0, 2 * Math.PI)
      ctx.strokeStyle = n.color
      ctx.lineWidth   = 1.5
      ctx.globalAlpha = pulseAlpha
      ctx.stroke()

      // Second pulse wave (offset phase)
      const t2 = ((Date.now() + 800) % 2400) / 2400
      const pulseRadius2 = size + 2 + t2 * size * 2
      const pulseAlpha2  = (1 - t2) * 0.25
      ctx.beginPath()
      ctx.arc(n.x, n.y, pulseRadius2, 0, 2 * Math.PI)
      ctx.strokeStyle = n.color
      ctx.lineWidth   = 1
      ctx.globalAlpha = pulseAlpha2
      ctx.stroke()

      ctx.globalAlpha = alpha
    }

    // ── Mid-tier: subtle glow ring ─────────────────────────────────────
    if (n.isMatch && n.tier === 'mid' && !dimmed) {
      const glowAlpha = 0.15 + 0.1 * Math.sin(Date.now() / 1500)
      ctx.beginPath()
      ctx.arc(n.x, n.y, size + 3, 0, 2 * Math.PI)
      ctx.strokeStyle = n.color
      ctx.lineWidth   = 1
      ctx.globalAlpha = glowAlpha
      ctx.stroke()
      ctx.globalAlpha = alpha
    }

    // ── Avatar image (drawn first) ─────────────────────────────────────
    if (n.avatarUrl) {
      const img = getAvatarImage(n.name)
      // Draw avatar inside circular clip
      ctx.save()
      ctx.beginPath()
      ctx.arc(n.x, n.y, size, 0, 2 * Math.PI)
      ctx.clip()
      // Draw with slight opacity if not loaded yet
      ctx.globalAlpha = img.complete && img.naturalWidth > 0 ? 1 : 0.3
      ctx.drawImage(img, n.x - size, n.y - size, size * 2, size * 2)
      ctx.restore()
    }

    // ── Subtle color tint (drawn after avatar, very low opacity) ───────
    // Only for "Me" and matches - non-matches show pure face
    if (n.isMe || n.isMatch) {
      ctx.beginPath()
      ctx.arc(n.x, n.y, size, 0, 2 * Math.PI)
      // Very low opacity so face shows through
      ctx.globalAlpha = n.isMe ? 0.3 : 0.15
      ctx.fillStyle = n.color
      ctx.fill()
      ctx.globalAlpha = alpha
    }

    // ── Border ring (only for me, high, mid tier) ──────────────────────
    if (n.isMe || (n.isMatch && (n.tier === 'high' || n.tier === 'mid'))) {
      ctx.beginPath()
      ctx.arc(n.x, n.y, size, 0, 2 * Math.PI)
      ctx.strokeStyle = n.isMe
        ? 'rgba(255,255,255,0.5)'
        : n.tier === 'high'
          ? 'rgba(255,255,255,0.85)'
          : 'rgba(255,255,255,0.4)'
      ctx.lineWidth = n.isMe ? 2 : 1.2
      ctx.stroke()
    }

    // ── Text inside circle (only for me and high-tier matches) ─────────
    // Me shows "Me", others show nothing (no percentages in graph)
    if (n.isMe && !dimmed) {
      const fontSize = 12
      ctx.font         = `bold ${fontSize}px sans-serif`
      ctx.fillStyle    = '#ffffff'
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Me', n.x, n.y)
    }

    ctx.globalAlpha = 1
  }, [isHighlighted])

  // ── Link styling ───────────────────────────────────────────────────────
  const linkColor = useCallback((link: object) => {
    const l = link as GraphLink
    // Base color from score
    const base = scoreToColor(l.score)
    if (!selectedId) return `${base}60` // 38% alpha
    const src = typeof l.source === 'object' ? (l.source as any).id : l.source
    const tgt = typeof l.target === 'object' ? (l.target as any).id : l.target
    const active = src === selectedId || tgt === selectedId
    return active ? `${base}CC` : `${base}15`
  }, [selectedId])

  const linkWidth = useCallback((link: object) => {
    const l = link as GraphLink
    if (!selectedId) return 1 + l.score * 1.5  // 1–2.5px based on score
    const src = typeof l.source === 'object' ? (l.source as any).id : l.source
    const tgt = typeof l.target === 'object' ? (l.target as any).id : l.target
    const active = src === selectedId || tgt === selectedId
    return active ? 2.5 : 0.3
  }, [selectedId])

  // Particles only on high-score links when no selection, or active links
  const particleCount = useCallback((link: object) => {
    const l = link as GraphLink
    if (l.score < 0.85) return 0
    if (!selectedId) return 2
    const src = typeof l.source === 'object' ? (l.source as any).id : l.source
    const tgt = typeof l.target === 'object' ? (l.target as any).id : l.target
    return (src === selectedId || tgt === selectedId) ? 3 : 0
  }, [selectedId])

  const particleColor = useCallback((link: object) => {
    const l = link as GraphLink
    return scoreToColor(l.score)
  }, [])

      // ── Configure force link distance + reheat when data changes ──────────
  useEffect(() => {
    const g = graphRef.current
    if (!g) return
    // Set link distance: better match → closer to center, but far enough from Me
    const linkForce = g.d3Force('link') as any
    if (linkForce) {
      linkForce.distance((link: any) => 80 + (1 - (link.score ?? 0.5)) * 200)
    }
    const id = setTimeout(() => g.d3ReheatSimulation(), 100)
    return () => clearTimeout(id)
  }, [graphData.nodes.length, graphData.links.length])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[350px] select-none"
      style={{ cursor: 'default' }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.w}
        height={dimensions.h}
        nodeLabel=""
        linkColor={linkColor as any}
        linkWidth={linkWidth as any}
        linkDirectionalParticles={particleCount as any}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={particleColor as any}
        backgroundColor="transparent"
        onNodeClick={handleNodeClick as any}
        onNodeHover={handleNodeHover as any}
        onBackgroundClick={handleBackgroundClick as any}
        nodeColor={() => ''}             // handled by drawNode
        nodeVal={() => 1}                // handled by drawNode
        nodeCanvasObject={drawNode as any}
        nodeCanvasObjectMode={() => 'after'}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          // Increase hover area to cover whole circle with padding
          const size = (node.val || 6) * 1.2
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(node.x, node.y, size * 1.5, 0, 2 * Math.PI)  // 1.5x larger hover area
          ctx.fill()
        }}
        cooldownTicks={120}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.28}
        warmupTicks={30}
      />

      {/* ── Hover tooltip (removed - using fixed position below) ─────────── */}

      {/* ── Selected hint ─────────────────────────────────────────────── */}
      {selectedId && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#111118]/80 backdrop-blur-sm
                        border border-[#7F77DD]/30 rounded-full px-3 py-1 text-xs text-[#7F77DD]
                        pointer-events-none whitespace-nowrap">
          Click background to deselect
        </div>
      )}

      {/* ── Stats badge ───────────────────────────────────────────────── */}
      <div className="absolute top-3 right-3 text-[10px] font-mono text-gray-600 bg-[#0A0A0F]/60 backdrop-blur-sm rounded-full px-2.5 py-1 pointer-events-none">
        {graphData.nodes.length} attendees · {graphData.links.length} connections
      </div>

      {/* ── Legend (bottom-left) ───────────────────────────────────────── */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 text-[10px] font-mono pointer-events-none">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#00f2fe]" />
          <span className="text-gray-500">≥80%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#1D9E75]" />
          <span className="text-gray-500">≥65%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#7F77DD]" />
          <span className="text-gray-500">≥55%</span>
        </span>
      </div>

      {/* ── Hover tooltip (fixed position under "Live Network") ─────────── */}
      {tooltip && (
        <div className="absolute top-12 left-3 bg-brand-card border border-brand-border rounded-xl p-3 z-20 w-64 shadow-lg">
          <p className="text-white font-semibold text-sm">{tooltip.name}</p>
          {tooltip.role && (
            <p className="text-gray-400 text-xs mt-1">{tooltip.role}</p>
          )}
          {tooltip.score !== undefined && (
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-lg font-bold font-mono" style={{ color: scoreToColor(tooltip.score) }}>
                {Math.round(tooltip.score * 100)}%
              </p>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest">match</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}