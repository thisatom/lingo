import { useCallback, useEffect, useRef, useState } from 'react'
import {
  dismissAppUpdateToast,
  showAppUpdateAvailableToast,
  showAppUpdateStartedToast
} from '@/features/app-update/lib/app-update-toast'
import { isAppUpdateOverlayVisible } from '@/features/app-update/lib/app-update-progress-label'
import { AppUpdateOverlay } from '@/features/app-update/ui/AppUpdateOverlay'
import {
  installAppUpdate,
  isUpdaterAvailable,
  subscribeToAppUpdateAvailable,
  subscribeToAppUpdateProgress
} from '@/shared/lib/updater'
import type { AppUpdateInfo, AppUpdateProgress } from '@/shared/types/ipc'

/** User-confirmed install only — no silent full-screen block on startup. */
export function AppUpdateGate() {
  const [progress, setProgress] = useState<AppUpdateProgress | null>(null)
  const [installing, setInstalling] = useState(false)
  const installStartedRef = useRef(false)

  const startInstall = useCallback((update: AppUpdateInfo) => {
    if (installStartedRef.current) return
    installStartedRef.current = true
    setInstalling(true)
    dismissAppUpdateToast()
    showAppUpdateStartedToast(update)
    void installAppUpdate()
  }, [])

  useEffect(() => {
    if (!isUpdaterAvailable()) return

    const unsubProgress = subscribeToAppUpdateProgress((next) => {
      setProgress(next.phase === 'idle' ? null : next)
      if (next.phase === 'restarting' || next.phase === 'failed') {
        dismissAppUpdateToast()
      }
      if (next.phase === 'idle' || next.phase === 'failed') {
        installStartedRef.current = false
        setInstalling(false)
      }
    })

    const unsubAvailable = subscribeToAppUpdateAvailable((info) => {
      showAppUpdateAvailableToast(info, () => startInstall(info))
    })

    return () => {
      unsubProgress()
      unsubAvailable()
    }
  }, [startInstall])

  const overlayProgress =
    progress ?? (installing ? ({ phase: 'checking' } satisfies AppUpdateProgress) : null)

  if (!isUpdaterAvailable() || !isAppUpdateOverlayVisible(overlayProgress)) return null

  return <AppUpdateOverlay progress={overlayProgress} />
}
