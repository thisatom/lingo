import { useCallback, useEffect, useState } from 'react'
import { formatBytes } from '@/features/app-update/lib/format-bytes'
import { isElectronApp } from '@/shared/lib/lingo'
import {
  checkAppUpdate,
  getAppVersion,
  installAppUpdate,
  isUpdaterAvailable
} from '@/shared/lib/updater'
import {
  settingsCardClass,
  settingsRowClass,
  settingsRowDescriptionClass,
  settingsRowTextWrapClass,
  settingsRowTitleClass,
  settingsSubsectionTitleClass
} from '@/shared/lib/settings-surface'
import { Button } from '@/shared/ui/button'
import type { AppUpdateInfo } from '@/shared/types/ipc'

export function AppUpdateSettingsSection() {
  const desktop = isElectronApp() && isUpdaterAvailable()
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [available, setAvailable] = useState<AppUpdateInfo | null>(null)

  useEffect(() => {
    if (!desktop) return
    void getAppVersion().then(setCurrentVersion)
  }, [desktop])

  const handleCheck = useCallback(async () => {
    if (!desktop) return
    setChecking(true)
    setError(null)
    setStatus(null)
    setAvailable(null)
    try {
      const result = await checkAppUpdate()
      if (!result) return
      setCurrentVersion(result.currentVersion)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.update) {
        setAvailable(result.update)
        setStatus(`Version ${result.update.version} is available.`)
      } else {
        setStatus('You are on the latest version.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update check failed')
    } finally {
      setChecking(false)
    }
  }, [desktop])

  const handleInstall = useCallback(async () => {
    if (!desktop) return
    setInstalling(true)
    setError(null)
    try {
      const result = await installAppUpdate()
      if (!result?.ok) {
        setError(result?.error ?? 'Could not start the update')
        setInstalling(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
      setInstalling(false)
    }
  }, [desktop])

  if (!desktop) return null

  const sizeLabel = formatBytes(available?.downloadSize)

  return (
    <>
      <p className={settingsSubsectionTitleClass}>Updates</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>App version</p>
            <p className={settingsRowDescriptionClass}>
              {currentVersion ? `Installed: ${currentVersion}` : 'Loading version…'}
              {status ? ` ${status}` : null}
              {available && sizeLabel ? ` Download size: ${sizeLabel}.` : null}
            </p>
            {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-6 px-2 text-[11px]"
              disabled={checking || installing}
              onClick={() => void handleCheck()}
            >
              {checking ? 'Checking…' : 'Check for updates'}
            </Button>
            {available ? (
              <Button
                type="button"
                size="xs"
                className="h-6 px-2 text-[11px]"
                disabled={installing}
                onClick={() => void handleInstall()}
              >
                {installing ? 'Updating…' : `Update to ${available.version}`}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
