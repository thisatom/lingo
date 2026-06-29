import type { AppUpdateInfo } from '@/shared/types/ipc'

export function formatUpdateTitle(update: Pick<AppUpdateInfo, 'version' | 'name' | 'tag'>): string {
  const name = update.name?.trim()
  if (name && name !== update.tag) return name
  return `Lingo v${update.version}`
}

export function formatReleasePreview(body: string, maxLength = 220): string {
  const plain = body
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!plain) return 'No release notes for this version.'
  if (plain.length <= maxLength) return plain
  return `${plain.slice(0, maxLength).trimEnd()}…`
}

export function formatDownloadSize(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}
