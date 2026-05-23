import type { QueuedMessage } from '@/entities/message-queue/model/store'

const MAX_PREVIEW_LEN = 120

export function formatQueuedMessagePreview(item: QueuedMessage | undefined): string {
  if (!item) return ''
  const text = item.content.trim()
  if (text) {
    return text.length > MAX_PREVIEW_LEN ? `${text.slice(0, MAX_PREVIEW_LEN - 1)}…` : text
  }
  if ((item.attachments?.length ?? 0) > 0) return 'Attached files'
  return ''
}
