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
      sessionStorage.setItem('vibecheck_attendee', JSON.stringify(attendee))

      // Fire match in background so dashboard loads fast
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

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md gap-6"
      >
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-brand-purple/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-brand-purple border-r-brand-teal animate-spin" />
          <div className="absolute inset-3 rounded-full bg-brand-purple/15 blur-sm animate-pulse" />
        </div>
        <p className="text-white font-semibold text-lg tracking-wide">Analyzing Synergies</p>
      </motion.div>
    )
  }

  const inputClass = `w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3
    text-white placeholder-gray-600 focus:outline-none focus:border-brand-purple/70
    focus:ring-1 focus:ring-brand-purple/20 transition-all duration-200`

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-lg space-y-4"
    >
      {/* Name + Role side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
            Name <span className="text-brand-purple">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Priya Sharma"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
            Role
          </label>
          <input
            type="text"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="VC Partner @ Hashed"
            className={inputClass}
          />
        </div>
      </div>

      {/* Mandate */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
          Your mandate <span className="text-brand-purple">*</span>
          <span className="ml-2 text-gray-600 normal-case font-normal">— What are you here to find?</span>
        </label>
        <textarea
          value={mandate}
          onChange={e => setMandate(e.target.value)}
          placeholder='e.g. "Looking for Series A DeFi infrastructure plays in Southeast Asia with institutional traction"'
          required
          rows={3}
          className={`${inputClass} resize-none`}
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${mandate.length > 900 ? 'text-red-400' : 'text-gray-600'}`}>
            {mandate.length}/1000
          </span>
        </div>
      </div>

      {/* Telegram */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
          Telegram <span className="text-gray-600 font-normal normal-case">(optional)</span>
        </label>
        <input
          type="text"
          value={telegram}
          onChange={e => setTelegram(e.target.value)}
          placeholder="@username"
          className={inputClass}
        />
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2"
        >
          {error}
        </motion.p>
      )}

      <motion.button
        type="submit"
        disabled={!name || !mandate}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full bg-brand-purple hover:bg-brand-purple/90 disabled:opacity-40
                   disabled:cursor-not-allowed text-white font-semibold rounded-xl py-4
                   text-lg transition-all duration-200 flex items-center justify-center gap-2
                   shadow-glow-purple"
      >
        Find My Matches →
      </motion.button>
    </motion.form>
  )
}
