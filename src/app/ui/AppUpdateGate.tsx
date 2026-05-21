import { useEffect, useState } from 'react'
import { AppUpdateAvailableDialog } from '@/features/app-update/ui/AppUpdateAvailableDialog'
import { AppUpdateReleaseNotesDialog } from '@/features/app-update/ui/AppUpdateReleaseNotesDialog'
import {
  consumePostUpdateNotice,
  isUpdaterAvailable,
  subscribeToAppUpdateAvailable
} from '@/shared/lib/updater'
import type { AppUpdateInfo, PendingUpdateNotice } from '@/shared/types/ipc'

const AVAILABLE_DISMISSED_KEY = 'lingo-update-available-dismissed'

function wasUpdateDismissed(version: string): boolean {
  try {
    return sessionStorage.getItem(AVAILABLE_DISMISSED_KEY) === version
  } catch {
    return false
  }
}

function markUpdateDismissed(version: string): void {
  try {
    sessionStorage.setItem(AVAILABLE_DISMISSED_KEY, version)
  } catch {
    // ignore
  }
}

/** Post-update release notes and optional background update prompt. */
export function AppUpdateGate() {
  const [postUpdateNotice, setPostUpdateNotice] = useState<PendingUpdateNotice | null>(null)
  const [availableUpdate, setAvailableUpdate] = useState<AppUpdateInfo | null>(null)
  const [availableOpen, setAvailableOpen] = useState(false)

  useEffect(() => {
    if (!isUpdaterAvailable()) return

    void consumePostUpdateNotice().then((notice) => {
      if (notice) setPostUpdateNotice(notice)
    })

    return subscribeToAppUpdateAvailable((info) => {
      if (wasUpdateDismissed(info.version)) return
      setAvailableUpdate(info)
      setAvailableOpen(true)
    })
  }, [])

  if (!isUpdaterAvailable()) return null

  return (
    <>
      {postUpdateNotice ? (
        <AppUpdateReleaseNotesDialog
          notice={postUpdateNotice}
          open
          onOpenChange={(open) => {
            if (!open) setPostUpdateNotice(null)
          }}
        />
      ) : null}

      {availableUpdate ? (
        <AppUpdateAvailableDialog
          update={availableUpdate}
          open={availableOpen}
          onOpenChange={(open) => {
            setAvailableOpen(open)
            if (!open) {
              markUpdateDismissed(availableUpdate.version)
              setAvailableUpdate(null)
            }
          }}
        />
      ) : null}
    </>
  )
}
