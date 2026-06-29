import type { AppUpdateCheckResult, AppUpdateInfo, AppUpdateProgress } from '@/shared/types/ipc'

export function isUpdaterAvailable(): boolean {
  return Boolean(window.lingo?.updater)
}

export function getUpdater() {
  const updater = window.lingo?.updater
  if (!updater) {
    throw new Error('Updates are only available in the desktop app.')
  }
  return updater
}

export async function getAppVersion(): Promise<string | null> {
  if (!isUpdaterAvailable()) return null
  return getUpdater().getCurrentVersion()
}

export async function checkAppUpdate(): Promise<AppUpdateCheckResult | null> {
  if (!isUpdaterAvailable()) return null
  return getUpdater().check()
}

export async function installAppUpdate(): Promise<{ ok: boolean; error?: string } | null> {
  if (!isUpdaterAvailable()) return null
  return getUpdater().downloadAndInstall()
}

export async function openAppReleasesPage(): Promise<void> {
  if (!isUpdaterAvailable()) return
  await getUpdater().openReleasesPage()
}

export function subscribeToAppUpdateAvailable(handler: (info: AppUpdateInfo) => void): () => void {
  if (!isUpdaterAvailable()) return () => {}
  return getUpdater().onUpdateAvailable(handler)
}

export function subscribeToAppUpdateProgress(
  handler: (progress: AppUpdateProgress) => void
): () => void {
  if (!isUpdaterAvailable()) return () => {}
  return getUpdater().onUpdateProgress(handler)
}
