const dismissHandlers = new Set<() => void>()
let dismissing = false

export function registerTooltipDismissHandler(handler: () => void): () => void {
  dismissHandlers.add(handler)
  return () => {
    dismissHandlers.delete(handler)
  }
}

/** Close every open Lingo tooltip without synthetic DOM events. */
export function dismissAllTooltips(): void {
  if (dismissing || dismissHandlers.size === 0) return
  dismissing = true
  try {
    for (const handler of [...dismissHandlers]) handler()
  } finally {
    dismissing = false
  }
}
