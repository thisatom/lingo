import { useEffect, useRef, useState } from 'react'

/** Returns `value` at most once per `intervalMs` while `enabled`; always sync when disabled. */
export function useThrottledValue(value: string, intervalMs: number, enabled: boolean): string {
  const [display, setDisplay] = useState(value)
  const latestRef = useRef(value)
  latestRef.current = value

  useEffect(() => {
    if (!enabled) {
      setDisplay(value)
      return
    }

    const timer = window.setTimeout(() => {
      setDisplay(latestRef.current)
    }, intervalMs)

    return () => window.clearTimeout(timer)
  }, [value, intervalMs, enabled])

  return enabled ? display : value
}

/**
 * Throttles expensive markdown re-parses during streaming: rAF-aligned commits with a
 * minimum interval so layout stays smooth without falling more than ~12 frames behind.
 */
export function useStreamMarkdownValue(
  value: string,
  enabled: boolean,
  minIntervalMs = 80
): string {
  const [display, setDisplay] = useState(value)
  const latestRef = useRef(value)
  const displayRef = useRef(value)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const lastCommitRef = useRef(0)
  latestRef.current = value

  useEffect(() => {
    if (!enabled) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (timerRef.current != null) clearTimeout(timerRef.current)
      rafRef.current = null
      timerRef.current = null
      displayRef.current = value
      setDisplay(value)
      return
    }

    const commit = () => {
      lastCommitRef.current = performance.now()
      displayRef.current = latestRef.current
      setDisplay(latestRef.current)
    }

    const schedule = () => {
      const elapsed = performance.now() - lastCommitRef.current
      if (elapsed >= minIntervalMs) {
        if (rafRef.current != null) return
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null
          commit()
        })
        return
      }
      if (timerRef.current != null) return
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        schedule()
      }, minIntervalMs - elapsed)
    }

    const lag = latestRef.current.length - displayRef.current.length
    if (displayRef.current.length === 0 && latestRef.current.length > 0) {
      commit()
      return
    }
    if (lag > 240) {
      commit()
      return
    }

    schedule()

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (timerRef.current != null) clearTimeout(timerRef.current)
    }
  }, [value, enabled, minIntervalMs])

  return enabled ? display : value
}
