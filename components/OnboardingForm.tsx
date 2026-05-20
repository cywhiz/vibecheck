'use client'
import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export function OnboardingForm() {
  const router = useRouter()
  const [name,     setName]     = useState('')
  const [role,     setRole]     = useState('')
  const [mandate,  setMandate]  = useState('')
  const [telegram, setTelegram] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !mandate.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, mandate, telegram }),
      })


      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }

      const { attendee } = await res.json()

      // Store attendee ID in sessionStorage for the dashboard
      sessionStorage.setItem('vibecheck_attendee', JSON.stringify(attendee))

      // Trigger match in background so dashboard loads fast
      fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId: attendee.id }),
      })

      router.push(`/dashboard?id=${attendee.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-lg space-y-5"
    >
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Your name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Priya Sharma"
          required
          className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3
                     text-white placeholder-gray-600 focus:outline-none focus:border-brand-purple
                     transition-colors"
        />
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Your role</label>
        <input
          type="text"
          value={role}
          onChange={e => setRole(e.target.value)}
          placeholder="e.g. VC Partner @ Hashed"
          className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3
                     text-white placeholder-gray-600 focus:outline-none focus:border-brand-purple
                     transition-colors"
        />
      </div>

      {/* Mandate — the most important field */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Your mandate *{' '}
          <span className="text-xs text-gray-600">
            — What are you here to find? Be specific.
          </span>
        </label>
        <textarea
          value={mandate}
          onChange={e => setMandate(e.target.value)}
          placeholder='e.g. "Looking for Series A DeFi infrastructure plays in Southeast Asia with institutional traction"'
          required
          rows={3}
          className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3
                     text-white placeholder-gray-600 focus:outline-none focus:border-brand-purple
                     transition-colors resize-none"
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${mandate.length > 900 ? 'text-red-400' : 'text-gray-600'}`}>
            {mandate.length}/1000
          </span>
        </div>
      </div>


      {/* Telegram */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Telegram <span className="text-xs text-gray-600">(optional — for direct connects)</span>
        </label>
        <input
          type="text"
          value={telegram}
          onChange={e => setTelegram(e.target.value)}
          placeholder="@username"
          className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3
                     text-white placeholder-gray-600 focus:outline-none focus:border-brand-purple
                     transition-colors"
        />
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-400 text-sm text-center"
        >
          {error}
        </motion.p>
      )}

      <button
        type="submit"
        disabled={loading || !name || !mandate}
        className="w-full bg-brand-purple hover:bg-brand-purple/80 disabled:opacity-40
                   disabled:cursor-not-allowed text-white font-semibold rounded-xl py-4
                   text-lg transition-all duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            Finding your matches…
          </>
        ) : (
          'Find My Matches →'
        )}
      </button>
    </motion.form>
  )
}
