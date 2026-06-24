import type { AppUpdateProgress } from '@/shared/types/ipc'

export function getAppUpdateProgressLabel(progress: AppUpdateProgress): string {
  switch (progress.phase) {
    case 'checking':
      return 'Checking for updates…'
    case 'downloading':
      if (progress.percent != null && progress.percent > 0) {
        return `Downloading v${progress.version ?? ''}… ${progress.percent}%`.trim()
      }
      return `Downloading v${progress.version ?? 'update'}…`
    case 'installing':
      return `Installing v${progress.version ?? 'update'}…`
    case 'restarting':
      return 'Restarting Lingo…'
    case 'failed':
      return progress.message ?? 'Update failed'
    default:
      return ''
  }
}

export function isAppUpdateOverlayVisible(progress: AppUpdateProgress | null): boolean {
  if (!progress) return false
  return (
    progress.phase === 'checking' ||
    progress.phase === 'downloading' ||
    progress.phase === 'installing' ||
    progress.phase === 'restarting'
  )
}
