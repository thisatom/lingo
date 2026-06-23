export class LocalWebSearchError extends Error {
  readonly code: 'unavailable' | 'network' | 'aborted'

  constructor(message: string, code: 'unavailable' | 'network' | 'aborted' = 'network') {
    super(message)
    this.name = 'LocalWebSearchError'
    this.code = code
  }
}

export function isLocalWebSearchFailure(error: unknown): boolean {
  if (error instanceof LocalWebSearchError) return true
  if (error instanceof DOMException && error.name === 'AbortError') return true
  const message = error instanceof Error ? error.message : String(error)
  return message.toLowerCase().includes('aborted')
}

export const SEARCH_FALLBACK_NOTICE =
  'Web search is unavailable for this turn; answering from the model without live results.'
