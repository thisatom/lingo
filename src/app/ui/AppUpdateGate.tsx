import { useCallback, useEffect, useRef, useState } from 'react'
import {
  dismissAppUpdateToast,
  showAppUpdateStartedToast
} from '@/features/app-update/lib/app-update-toast'
import { AppUpdateOverlay } from '@/features/app-update/ui/AppUpdateOverlay'
import {
  installAppUpdate,
  isUpdaterAvailable,
  subscribeToAppUpdateAvailable,
  subscribeToAppUpdateProgress
} from '@/shared/lib/updater'
import type { AppUpdateInfo, AppUpdateProgress } from '@/shared/types/ipc'

const AUTO_INSTALL_SESSION_KEY = 'lingo-update-auto-install'

function wasAutoInstallStarted(version: string): boolean {
  try {
    return sessionStorage.getItem(AUTO_INSTALL_SESSION_KEY) === version
  } catch {
    return false
  }
}

function markAutoInstallStarted(version: string): void {
  try {
    sessionStorage.setItem(AUTO_INSTALL_SESSION_KEY, version)
  } catch {
    // ignore
  }
}

/** Silent background updates with a styled toast + progress overlay. */
export function AppUpdateGate() {
  const [progress, setProgress] = useState<AppUpdateProgress | null>(null)
  const installStartedRef = useRef(false)

  const startSilentInstall = useCallback((update: AppUpdateInfo) => {
    if (installStartedRef.current || wasAutoInstallStarted(update.version)) return
    installStartedRef.current = true
    markAutoInstallStarted(update.version)
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
    })

    const unsubAvailable = subscribeToAppUpdateAvailable((info) => {
      startSilentInstall(info)
    })

    return () => {
      unsubProgress()
      unsubAvailable()
    }
  }, [startSilentInstall])

  if (!isUpdaterAvailable()) return null

  return <AppUpdateOverlay progress={progress} />
}
