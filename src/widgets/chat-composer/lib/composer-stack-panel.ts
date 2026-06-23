import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { QueuedMessage } from '@/entities/message-queue/model/store'
import { cn } from '@/shared/lib/utils'

export function composerStackPanelShellClass(embedded: boolean, className?: string): string {
  return cn(
    embedded
      ? 'border-b border-border bg-surface-raised/60'
      : 'overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm',
    className
  )
}

export function filterAttachmentsByQuery(
  items: readonly MessageAttachment[],
  query: string
): MessageAttachment[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return [...items]
  return items.filter((item) => item.name.toLowerCase().includes(needle))
}

export function filterQueuedByQuery(
  items: readonly QueuedMessage[],
  query: string
): QueuedMessage[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return [...items]
  return items.filter((item) => {
    if (item.content.toLowerCase().includes(needle)) return true
    return (item.attachments ?? []).some((attachment) =>
      attachment.name.toLowerCase().includes(needle)
    )
  })
}
