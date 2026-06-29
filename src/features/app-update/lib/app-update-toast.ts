import { formatReleasePreview, formatUpdateTitle } from '@/features/app-update/lib/app-update-format'
import { lingoToast } from '@/shared/ui/lingo-toast'
import type { AppUpdateInfo } from '@/shared/types/ipc'

export const APP_UPDATE_TOAST_ID = 'lingo-app-update'

const APP_UPDATE_TOAST_DURATION_MS = 12_000

export function showAppUpdateAvailableToast(
  update: AppUpdateInfo,
  onInstall: () => void
): void {
  const title = formatUpdateTitle(update)
  const preview = formatReleasePreview(update.body, 120)

  lingoToast.info('Update available', {
    id: APP_UPDATE_TOAST_ID,
    duration: APP_UPDATE_TOAST_DURATION_MS,
    description: `${title} is ready. ${preview}`,
    action: {
      label: 'Install now',
      onClick: onInstall
    },
    cancel: {
      label: 'Later',
      onClick: () => lingoToast.dismiss(APP_UPDATE_TOAST_ID)
    }
  })
}

export function showAppUpdateStartedToast(update: AppUpdateInfo): void {
  lingoToast.loading('Installing update', {
    id: APP_UPDATE_TOAST_ID,
    description: `${formatUpdateTitle(update)} — preparing download.`,
    duration: 20_000
  })
}

export function showAppUpdateFailedToast(message: string): void {
  lingoToast.error('Update failed', {
    id: APP_UPDATE_TOAST_ID,
    description: message,
    duration: 14_000
  })
}

export function dismissAppUpdateToast(): void {
  lingoToast.dismiss(APP_UPDATE_TOAST_ID)
}
