import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VibeCheck — Find your deal in seconds. Own it on-chain forever.',
  description: 'Real-time semantic networking intelligence for SEABW 2026. AI-powered matching + Sign Protocol attestations on Base.',
  openGraph: {
    title: 'VibeCheck',
    description: 'Find your deal in seconds. Own it on-chain forever.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-brand-dark antialiased">
        {children}
      </body>
    </html>
  )
}
