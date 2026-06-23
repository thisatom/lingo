import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  error: Error | null
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[lingo] UI crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
          <h1 className="text-lg font-semibold">Lingo failed to start</h1>
          <p className="max-w-lg text-sm text-muted-foreground">
            {this.state.error.message || 'Unknown renderer error'}
          </p>
          <button
            type="button"
            className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm hover:bg-accent"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
