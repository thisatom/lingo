import { useEffect } from 'react'

/** Run reset after close animation so open state does not flash before the dialog unmounts. */
export function useDeferredResetOnClose(
  open: boolean,
  reset: () => void,
  delayMs = 100
): void {
  useEffect(() => {
    if (open) return
    const id = window.setTimeout(reset, delayMs)
    return () => window.clearTimeout(id)
  }, [open, reset, delayMs])
}
