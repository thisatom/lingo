import { toast } from 'sonner'
import type { AppUpdateInfo } from '@/shared/types/ipc'

export const APP_UPDATE_TOAST_ID = 'lingo-app-update'

const APP_UPDATE_TOAST_DURATION_MS = 10_000

export function showAppUpdateAvailableToast(
  _update: AppUpdateInfo,
  onInstall: () => void
): void {
  toast.info('There is an available update.', {
    id: APP_UPDATE_TOAST_ID,
    duration: APP_UPDATE_TOAST_DURATION_MS,
    closeButton: true,
    action: {
      label: 'Download Update',
      onClick: onInstall
    },
    cancel: {
      label: 'Later',
      onClick: () => toast.dismiss(APP_UPDATE_TOAST_ID)
    }
  })
}

export function showAppUpdateStartedToast(update: AppUpdateInfo): void {
  const label = update.name?.trim() || `Lingo v${update.version}`

  toast('Installing update', {
    id: APP_UPDATE_TOAST_ID,
    description: `${label} — download in progress.`,
    duration: 12_000
  })
}

export function dismissAppUpdateToast(): void {
  toast.dismiss(APP_UPDATE_TOAST_ID)
}
