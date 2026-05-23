/** Coalesces rapid stream text updates to one store write per animation frame. */
export function createStreamContentSync(sync: (text: string) => void) {
  let pending: string | null = null
  let rafId: number | null = null

  const flush = () => {
    rafId = null
    if (pending === null) return
    const text = pending
    pending = null
    sync(text)
  }

  return {
    push(text: string) {
      pending = text
      if (rafId != null) return
      rafId = requestAnimationFrame(flush)
    },
    flushNow(text: string) {
      if (rafId != null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      pending = null
      sync(text)
    },
    cancel() {
      if (rafId != null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      pending = null
    }
  }
}
