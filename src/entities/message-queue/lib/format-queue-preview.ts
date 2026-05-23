import type { QueuedMessage } from '@/entities/message-queue/model/store'

const MAX_PREVIEW_LEN = 140

export function formatQueuePreview(item: QueuedMessage | undefined): string | null {
  if (!item) return null
  const text = item.content.trim()
  if (text) {
    return text.length > MAX_PREVIEW_LEN ? `${text.slice(0, MAX_PREVIEW_LEN - 1)}…` : text
  }
  if ((item.attachments?.length ?? 0) > 0) return 'Attached files'
  return null
}
