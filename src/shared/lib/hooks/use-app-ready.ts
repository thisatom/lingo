import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'

/** Safety net if settings persist never finishes (corrupt storage, etc.). */
const SETTINGS_HYDRATION_TIMEOUT_MS = 2_000

export function hideAppSplash(): void {
  const el = document.getElementById('app-splash')
  if (!el) return
  el.classList.add('app-splash--hide')
  window.setTimeout(() => {
    el.remove()
  }, 240)
}

/**
 * True once settings are hydrated — enough to render the shell.
 * Chat history may still load; conversation UI handles that separately.
 */
export function useAppReady(): boolean {
  const [ready, setReady] = useState(() => useSettingsStore.persist.hasHydrated())

  useEffect(() => {
    if (useSettingsStore.persist.hasHydrated()) {
      setReady(true)
      return
    }

    let cancelled = false
    const unsub = useSettingsStore.persist.onFinishHydration(() => {
      if (!cancelled) setReady(true)
    })

    const hydrationTimeout = window.setTimeout(() => {
      if (cancelled || useSettingsStore.persist.hasHydrated()) return
      console.warn('[lingo] Settings hydration timed out; continuing startup')
      setReady(true)
    }, SETTINGS_HYDRATION_TIMEOUT_MS)

    return () => {
      cancelled = true
      window.clearTimeout(hydrationTimeout)
      unsub()
    }
  }, [])

  return ready
}
