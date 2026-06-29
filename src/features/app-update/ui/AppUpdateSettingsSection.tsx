import { useCallback, useEffect, useState } from 'react'
import {
  formatDownloadSize,
  formatReleasePreview,
  formatUpdateTitle
} from '@/features/app-update/lib/app-update-format'
import { isElectronApp } from '@/shared/lib/lingo'
import {
  checkAppUpdate,
  getAppVersion,
  installAppUpdate,
  isUpdaterAvailable,
  openAppReleasesPage,
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
import { AppUpdateProgressSteps } from '@/features/app-update/ui/AppUpdateProgressSteps'
import type { AppUpdateInfo, AppUpdateProgress } from '@/shared/types/ipc'

type UpdateStatus = 'loading' | 'current' | 'available' | 'updating' | 'error'

function statusPillClass(status: UpdateStatus): string {
  switch (status) {
    case 'current':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'available':
    case 'updating':
      return 'bg-primary/10 text-primary'
    case 'error':
      return 'bg-destructive/10 text-destructive'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function statusLabel(
  status: UpdateStatus,
  update: AppUpdateInfo | null,
  currentVersion: string | null,
  progress: AppUpdateProgress | null
): string {
  switch (status) {
    case 'loading':
      return 'Checking for updates…'
    case 'current':
      return currentVersion ? `Up to date · v${currentVersion}` : 'Up to date'
    case 'available':
      return update ? `v${update.version} available` : 'Update available'
    case 'updating':
      if (progress?.phase === 'downloading' && progress.percent != null && progress.percent > 0) {
        return `Downloading… ${progress.percent}%`
      }
      if (progress?.phase === 'installing') return 'Installing…'
      if (progress?.phase === 'restarting') return 'Restarting…'
      if (progress?.phase === 'checking') return 'Preparing…'
      return 'Installing update…'
    case 'error':
      return 'Update failed'
    default:
      return ''
  }
}

export function AppUpdateSettingsSection() {
  const desktop = isElectronApp() && isUpdaterAvailable()
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)
  const [pendingUpdate, setPendingUpdate] = useState<AppUpdateInfo | null>(null)
  const [status, setStatus] = useState<UpdateStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<AppUpdateProgress | null>(null)

  const runCheck = useCallback(async () => {
    if (!desktop) return
    setStatus('loading')
    setError(null)
    setPendingUpdate(null)
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
        setPendingUpdate(result.update)
        setStatus('available')
      } else {
        setStatus('current')
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Update check failed')
    }
  }, [desktop])

  const runInstall = useCallback(async () => {
    if (!desktop) return
    setStatus('updating')
    setError(null)
    const result = await installAppUpdate()
    if (result && !result.ok) {
      setStatus('error')
      setError(result.error ?? 'Update failed')
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
      if (next.phase === 'idle') {
        setProgress(null)
        return
      }

      setProgress(next)

      if (
        next.phase === 'checking' ||
        next.phase === 'downloading' ||
        next.phase === 'installing' ||
        next.phase === 'restarting'
      ) {
        setStatus('updating')
        setError(null)
      }

      if (next.phase === 'failed') {
        setStatus('error')
        setError(next.message ?? 'Update failed')
        setProgress(null)
      }
    })
  }, [desktop])

  if (!desktop) return null

  const isUpdating = status === 'updating'
  const canInstall = status === 'available' || (status === 'error' && pendingUpdate != null)

  return (
    <>
      <p className={settingsSubsectionTitleClass}>Software update</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Lingo desktop</p>
            <p className={settingsRowDescriptionClass}>
              Updates download from GitHub Releases and install when you confirm.
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                  statusPillClass(status)
                )}
              >
                {statusLabel(status, pendingUpdate, currentVersion, progress)}
              </span>
              {currentVersion && !isUpdating ? (
                <span className="text-[11px] text-muted-foreground">Installed v{currentVersion}</span>
              ) : null}
              {pendingUpdate && status === 'available' ? (
                <span className="text-[11px] text-muted-foreground">
                  {formatDownloadSize(pendingUpdate.downloadSize) ?? 'Installer ready'}
                </span>
              ) : null}
            </div>

            {isUpdating && progress ? (
              <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                <AppUpdateProgressSteps phase={progress.phase} />
              </div>
            ) : null}

            {pendingUpdate && status === 'available' ? (
              <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                <p className="text-xs font-medium text-foreground">
                  {formatUpdateTitle(pendingUpdate)}
                </p>
                <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                  {formatReleasePreview(pendingUpdate.body)}
                </p>
              </div>
            ) : null}

            {error ? <p className="mt-2 text-xs leading-snug text-destructive">{error}</p> : null}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
            {canInstall ? (
              <Button
                type="button"
                variant="default"
                size="xs"
                className="h-6 shrink-0 px-2 text-[11px]"
                disabled={isUpdating}
                onClick={() => void runInstall()}
              >
                Install update
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-6 shrink-0 px-2 text-[11px]"
              disabled={status === 'loading' || isUpdating}
              onClick={() => void runCheck()}
            >
              Check now
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-6 shrink-0 px-2 text-[11px] text-muted-foreground"
              disabled={isUpdating}
              onClick={() => void openAppReleasesPage()}
            >
              Releases
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
