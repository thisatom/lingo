import type { AppUpdateCheckResult, AppUpdateInfo, PendingUpdateNotice } from '@/shared/types/ipc'

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

export async function consumePostUpdateNotice(): Promise<PendingUpdateNotice | null> {
  if (!isUpdaterAvailable()) return null
  return getUpdater().consumePendingNotice()
}

export function subscribeToAppUpdateAvailable(handler: (info: AppUpdateInfo) => void): () => void {
  if (!isUpdaterAvailable()) return () => {}
  return getUpdater().onUpdateAvailable(handler)
}
