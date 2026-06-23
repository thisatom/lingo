import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { QueuedMessage } from '@/entities/message-queue/model/store'
import { cn } from '@/shared/lib/utils'

export function composerStackPanelShellClass(
  embedded: boolean,
  className?: string,
  embeddedDivider: 'top' | 'bottom' = 'bottom',
  listCollapsed = false
): string {
  return cn(
    embedded
      ? cn(
          embeddedDivider === 'top' ? 'border-t border-border' : 'border-b border-border',
          listCollapsed ? 'bg-surface-raised/40' : 'bg-surface-raised/60'
        )
      : 'overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm',
    className
  )
}

/** Panels start collapsed — header only until the user expands. */
export const COMPOSER_STACK_PANEL_DEFAULT_COLLAPSED = true

/** Stack panels (attachments, queue) — may shrink inside a capped composer shell. */
export const composerStackPanelFlexShrinkClass = 'min-h-0 shrink overflow-hidden'

/** Textarea scroll region — never shrink below one input line. */
export const composerTextareaScrollClass = 'max-h-40 min-h-11 w-full shrink-0'

export function composerStackPanelHeaderClass(listCollapsed: boolean): string {
  return cn('px-3', listCollapsed ? 'py-1.5' : 'py-2', !listCollapsed && 'border-b border-border')
}

export function toggleStackPanelCollapse(
  listCollapsed: boolean,
  setListCollapsed: (collapsed: boolean) => void,
  resetSearch: () => void
): void {
  if (listCollapsed) {
    setListCollapsed(false)
    return
  }
  resetSearch()
  setListCollapsed(true)
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
