'use client'
import { Component, ReactNode } from 'react'

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  override componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-red-400 font-medium">Something went wrong</p>
          <p className="text-gray-500 text-sm mt-1">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="mt-3 text-sm text-red-400 underline"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
