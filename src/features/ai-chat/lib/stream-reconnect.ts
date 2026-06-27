export function isRetryableStreamError(error: unknown): boolean {
  if (error instanceof Error && error.name === 'AbortError') return false
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase()
  if (message.includes('aborted')) return false
  if (message.includes('no_openrouter_key')) return false

  return (
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('504') ||
    message.includes('overloaded') ||
    message.includes('unavailable') ||
    message.includes('temporarily') ||
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('upstream')
  )
}

export const STREAM_RECONNECT_MAX_ATTEMPTS = 3

export const STREAM_RECONNECT_DELAYS_MS = [800, 1600, 3200] as const

export function reconnectDelayMs(attempt: number): number {
  return STREAM_RECONNECT_DELAYS_MS[Math.min(attempt, STREAM_RECONNECT_DELAYS_MS.length - 1)]!
}

export function sleepMs(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'))
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
