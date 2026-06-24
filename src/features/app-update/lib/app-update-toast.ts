import { toast } from 'sonner'
import type { AppUpdateInfo } from '@/shared/types/ipc'

export const APP_UPDATE_TOAST_ID = 'lingo-app-update'

export function showAppUpdateStartedToast(update: AppUpdateInfo): void {
  const label = update.name?.trim() || `Lingo v${update.version}`

  toast('Update available', {
    id: APP_UPDATE_TOAST_ID,
    description: `${label} — downloading and installing in the background.`,
    duration: 12_000,
    cancel: {
      label: 'Dismiss',
      onClick: () => toast.dismiss(APP_UPDATE_TOAST_ID)
    }
  })
}

export function dismissAppUpdateToast(): void {
  toast.dismiss(APP_UPDATE_TOAST_ID)
}
