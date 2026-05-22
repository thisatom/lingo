import { useCallback, useEffect, useRef, useState } from 'react'
import {
  persistAppState,
  waitForPersistAppState,
  type AppSaveStep
} from '@/app/lib/persist-app-state'
import { AppShutdownOverlay } from '@/app/ui/AppShutdownOverlay'

/**
 * Handles graceful persist on app close (Electron) and page hide (web).
 * Shows a small overlay with progress while data is written to disk.
 */
export function AppShutdownSaver() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<AppSaveStep>('scroll')
  const runningRef = useRef(false)

  const runSave = useCallback(async (): Promise<void> => {
    if (runningRef.current) {
      await waitForPersistAppState()
      return
    }
    runningRef.current = true
    setOpen(true)
    setStep('scroll')

    try {
      await persistAppState((next) => setStep(next))
      await new Promise((resolve) => window.setTimeout(resolve, 280))
    } finally {
      setOpen(false)
      runningRef.current = false
    }
  }, [])

  useEffect(() => {
    const api = window.lingo

    if (api?.app?.onPrepareShutdown) {
      return api.app.onPrepareShutdown(async () => {
        try {
          await runSave()
        } catch (error) {
          console.error('[lingo] Shutdown save failed:', error)
        } finally {
          api.app?.notifyShutdownComplete?.()
        }
      })
    }

    const onPageHide = () => {
      void runSave()
    }

    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [runSave])

  return <AppShutdownOverlay open={open} step={step} />
}
