import { OnboardingForm } from '@/components/OnboardingForm'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-teal/8 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 bg-brand-card border border-brand-border
                        rounded-full px-4 py-1.5 text-sm text-gray-500 mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse-slow" />
          SEABW 2026 · Bangkok · Live
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-4">
          Vibe<span className="text-brand-purple">Check</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-md mx-auto leading-relaxed">
          Drop your mandate. Our AI maps you on a live graph of every attendee
          and surfaces your top 3 high-signal matches —
          <span className="text-white"> co-signed on-chain forever.</span>
        </p>

        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-600">
          <span>🧠 Semantic AI</span>
          <span>⚡ Real-time graph</span>
          <span>⛓️ Sign Protocol</span>
          <span>🔵 Base L2</span>
        </div>
      </div>

      {/* Onboarding form */}
      <div className="w-full max-w-lg relative z-10">
        <OnboardingForm />
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-gray-700 relative z-10">
        Built at SEABW 2026 "Play to Build" Hackathon ·{' '}
        <a
          href="https://github.com/cywhiz/vibecheck"
          className="hover:text-gray-500 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </p>
    </main>
  )
}
