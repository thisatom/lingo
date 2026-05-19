import { useEffect, useState } from 'react'

/** Shows while `active`, then hides after `durationMs` (restarts when `active` becomes true again). */
export function useTimedVisibility(active: boolean, durationMs: number): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }

    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), durationMs)
    return () => window.clearTimeout(timer)
  }, [active, durationMs])

  return visible
}
