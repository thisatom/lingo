import { toast } from 'sonner'
import type { AppUpdateInfo } from '@/shared/types/ipc'

export const APP_UPDATE_TOAST_ID = 'lingo-app-update'

export function showAppUpdateToast(
  update: AppUpdateInfo,
  options: {
    onView: () => void
    onDismiss: () => void
  }
): void {
  toast('Доступно обновление', {
    id: APP_UPDATE_TOAST_ID,
    description: update.name || `Версия ${update.version}`,
    duration: Number.POSITIVE_INFINITY,
    action: {
      label: 'Подробнее',
      onClick: options.onView
    },
    cancel: {
      label: 'Позже',
      onClick: options.onDismiss
    }
  })
}

export function dismissAppUpdateToast(): void {
  toast.dismiss(APP_UPDATE_TOAST_ID)
}
