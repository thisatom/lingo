import { createRafCoalescer } from '@/shared/lib/raf-coalesce'

export type DeferredResizeObserver = {
  observer: ResizeObserver
  disconnect: () => void
}

/**
 * ResizeObserver whose callback runs on the next animation frame.
 * Avoids "ResizeObserver loop completed with undelivered notifications"
 * when the callback reads layout and writes styles that affect observed size.
 */
export function createDeferredResizeObserver(onResize: () => void): DeferredResizeObserver {
  const coalescer = createRafCoalescer(() => {
    // Second frame breaks observer → layout write → observer feedback loops.
    requestAnimationFrame(onResize)
  })
  const observer = new ResizeObserver(() => coalescer.schedule())

  return {
    observer,
    disconnect: () => {
      coalescer.cancel()
      observer.disconnect()
    }
  }
}
