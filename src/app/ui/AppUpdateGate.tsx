import { useCallback, useEffect, useRef, useState } from 'react'
import {
  dismissAppUpdateToast,
  showAppUpdateAvailableToast,
  showAppUpdateFailedToast,
  showAppUpdateStartedToast
} from '@/features/app-update/lib/app-update-toast'
import { formatUpdateTitle } from '@/features/app-update/lib/app-update-format'
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
  const [activeUpdate, setActiveUpdate] = useState<AppUpdateInfo | null>(null)
  const [installing, setInstalling] = useState(false)
  const installStartedRef = useRef(false)

  const startInstall = useCallback((update: AppUpdateInfo) => {
    if (installStartedRef.current) return
    installStartedRef.current = true
    setActiveUpdate(update)
    setInstalling(true)
    dismissAppUpdateToast()
    showAppUpdateStartedToast(update)
    void installAppUpdate().then((result) => {
      if (result && !result.ok) {
        installStartedRef.current = false
        setInstalling(false)
        setProgress(null)
      }
    })
  }, [])

  useEffect(() => {
    if (!isUpdaterAvailable()) return

    const unsubProgress = subscribeToAppUpdateProgress((next) => {
      if (next.phase === 'idle' || next.phase === 'failed') {
        setProgress(null)
      } else {
        setProgress(next)
      }

      if (next.phase === 'failed') {
        dismissAppUpdateToast()
        showAppUpdateFailedToast(next.message ?? 'Update failed')
        installStartedRef.current = false
        setInstalling(false)
      }

      if (next.phase === 'restarting') {
        dismissAppUpdateToast()
      }

      if (next.phase === 'idle') {
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

  const updateName = activeUpdate ? formatUpdateTitle(activeUpdate) : null

  return <AppUpdateOverlay progress={overlayProgress} updateName={updateName} />
}
