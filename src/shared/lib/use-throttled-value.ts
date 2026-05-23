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
