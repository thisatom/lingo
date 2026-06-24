import { useCallback, useEffect, useState } from 'react'
import { isElectronApp } from '@/shared/lib/lingo'
import {
  checkAppUpdate,
  getAppVersion,
  installAppUpdate,
  isUpdaterAvailable,
  subscribeToAppUpdateProgress
} from '@/shared/lib/updater'
import {
  settingsCardClass,
  settingsRowClass,
  settingsRowDescriptionClass,
  settingsRowTextWrapClass,
  settingsRowTitleClass,
  settingsSubsectionTitleClass
} from '@/shared/lib/settings-surface'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import type { AppUpdateProgress } from '@/shared/types/ipc'

type UpdateStatus = 'loading' | 'current' | 'available' | 'updating' | 'error'

function statusLabel(status: UpdateStatus, version: string | null, progress: AppUpdateProgress | null): string {
  switch (status) {
    case 'loading':
      return 'Checking for updates…'
    case 'current':
      return version ? `Version ${version} · Up to date` : 'Up to date'
    case 'available':
      return version ? `Version ${version} · Update ready` : 'Update ready'
    case 'updating':
      if (progress?.phase === 'downloading' && progress.percent != null) {
        return `Downloading… ${progress.percent}%`
      }
      if (progress?.phase === 'installing') return 'Installing update…'
      if (progress?.phase === 'restarting') return 'Restarting…'
      return 'Installing update…'
    case 'error':
      return 'Could not check for updates'
    default:
      return ''
  }
}

export function AppUpdateSettingsSection() {
  const desktop = isElectronApp() && isUpdaterAvailable()
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null)
  const [status, setStatus] = useState<UpdateStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<AppUpdateProgress | null>(null)

  const runCheck = useCallback(async () => {
    if (!desktop) return
    setStatus('loading')
    setError(null)
    setRemoteVersion(null)
    try {
      const result = await checkAppUpdate()
      if (!result) return
      setCurrentVersion(result.currentVersion)
      if (result.error) {
        setStatus('error')
        setError(result.error)
        return
      }
      if (result.update) {
        setRemoteVersion(result.update.version)
        setStatus('available')
        void installAppUpdate()
      } else {
        setStatus('current')
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Update check failed')
    }
  }, [desktop])

  useEffect(() => {
    if (!desktop) return
    void getAppVersion().then(setCurrentVersion)
    void runCheck()
  }, [desktop, runCheck])

  useEffect(() => {
    if (!desktop) return
    return subscribeToAppUpdateProgress((next) => {
      setProgress(next.phase === 'idle' ? null : next)
      if (
        next.phase === 'checking' ||
        next.phase === 'downloading' ||
        next.phase === 'installing' ||
        next.phase === 'restarting'
      ) {
        setStatus('updating')
      }
      if (next.phase === 'failed') {
        setStatus('error')
        setError(next.message ?? 'Update failed')
      }
    })
  }, [desktop])

  if (!desktop) return null

  const pillClass =
    status === 'current'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : status === 'available' || status === 'updating'
        ? 'bg-primary/10 text-primary'
        : status === 'error'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-muted text-muted-foreground'

  return (
    <>
      <p className={settingsSubsectionTitleClass}>Software update</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Lingo desktop</p>
            <p className={settingsRowDescriptionClass}>
              Updates download and install automatically in the background.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                  pillClass
                )}
              >
                {statusLabel(status, remoteVersion ?? currentVersion, progress)}
              </span>
              {currentVersion && status !== 'updating' ? (
                <span className="text-[11px] text-muted-foreground">
                  Installed v{currentVersion}
                </span>
              ) : null}
            </div>
            {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-6 shrink-0 px-2 text-[11px]"
            disabled={status === 'loading' || status === 'updating'}
            onClick={() => void runCheck()}
          >
            Check now
          </Button>
        </div>
      </div>
    </>
  )
}
