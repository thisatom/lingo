/** Chromium reports this when layout writes happen in the same frame as observation — not a real crash. */
export function isBenignResizeObserverError(message: string | undefined): boolean {
  if (!message) return false
  return (
    message.includes('ResizeObserver loop') ||
    message.includes('ResizeObserver loop limit exceeded')
  )
}
