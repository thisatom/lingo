import { useEffect, useState } from 'react'
import { useChatsStore } from '@/entities/chat/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'

const MIN_SPLASH_MS = 450

function storesHydrated(): boolean {
  return useChatsStore.persist.hasHydrated() && useSettingsStore.persist.hasHydrated()
}

export function hideAppSplash(): void {
  const el = document.getElementById('app-splash')
  if (!el) return
  el.classList.add('app-splash--hide')
  window.setTimeout(() => {
    el.remove()
  }, 240)
}

/** False until persisted stores are ready and the startup shell was shown briefly. */
export function useAppReady(): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const startedAt = Date.now()

    const tryReady = () => {
      if (cancelled || !storesHydrated()) return

      const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - startedAt))
      window.setTimeout(() => {
        if (cancelled) return
        requestAnimationFrame(() => {
          if (cancelled) return
          setReady(true)
        })
      }, wait)
    }

    tryReady()
    const unsubChats = useChatsStore.persist.onFinishHydration(tryReady)
    const unsubSettings = useSettingsStore.persist.onFinishHydration(tryReady)

    return () => {
      cancelled = true
      unsubChats()
      unsubSettings()
    }
  }, [])

  return ready
}
