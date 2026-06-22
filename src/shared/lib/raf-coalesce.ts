/** Coalesce rapid callbacks into one invocation per animation frame. */
export function createRafCoalescer(callback: () => void) {
  let rafId: number | null = null

  const schedule = () => {
    if (rafId != null) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      callback()
    })
  }

  const cancel = () => {
    if (rafId != null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  return { schedule, cancel }
}
