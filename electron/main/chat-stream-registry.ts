const abortControllers = new Map<string, AbortController>()

export function registerStreamAbort(channel: string): AbortSignal {
  const controller = new AbortController()
  abortControllers.set(channel, controller)
  return controller.signal
}

export function abortStream(channel: string): void {
  abortControllers.get(channel)?.abort()
  abortControllers.delete(channel)
}

export function clearStream(channel: string): void {
  abortControllers.delete(channel)
}
