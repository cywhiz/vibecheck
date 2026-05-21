import { OnboardingForm } from '@/components/OnboardingForm'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Deep ambient blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-purple/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-teal/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-brand-purple/4 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <div className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 bg-brand-card border border-brand-border
                        rounded-full px-4 py-1.5 text-sm text-gray-500 mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse-slow" />
          SEABW 2026 · Bangkok · Live
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-4 leading-none">
          Vibe<span className="text-brand-purple">Check</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-md mx-auto leading-relaxed">
          Drop your mandate. Our AI maps you on a live graph of every attendee
          and surfaces your top high-signal matches —{' '}
          <span className="text-white">co-signed on-chain forever.</span>
        </p>

        <div className="flex items-center justify-center gap-5 mt-6 text-sm">
          {[
            { icon: '🧠', label: 'Semantic AI' },
            { icon: '⚡', label: 'Real-time graph' },
            { icon: '⛓️', label: 'Sign Protocol' },
            { icon: '🔵', label: 'Base L2' },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-400 transition-colors"
            >
              {icon} {label}
            </span>
          ))}
        </div>
      </div>

      {/* Onboarding form */}
      <div className="w-full max-w-lg relative z-10">
        <OnboardingForm />
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-gray-700 relative z-10">
        Built at SEABW 2026 &quot;Play to Build&quot; Hackathon ·{' '}
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
