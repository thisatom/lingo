import { useState } from 'react'
import { ArrowUp, ChevronDown, CornerDownLeft, Pencil, Trash2 } from '@/shared/ui/icons'
import type { QueuedMessage } from '@/entities/message-queue/model/store'
import { QueuedMessageAttachments } from '@/features/chat-attachments/ui/QueuedMessageAttachments'
import { cn } from '@/shared/lib/utils'
import { TooltipIconButton, TooltipWrap } from '@/shared/ui/tooltip-wrap'

interface ChatMessageQueueProps {
  items: readonly QueuedMessage[]
  onUpdate: (id: string, content: string) => void
  onRemove: (id: string) => void
  onSendNow: (id: string) => void
  className?: string
}

function QueuedMessagePreview({ content }: { content: string }) {
  const text = content.trim()
  if (!text) return null

  return (
    <TooltipWrap label={text} side="top" align="start" contentClassName="max-w-sm whitespace-pre-wrap">
      <p className="line-clamp-1 min-w-0 cursor-default text-xs leading-5 text-muted-foreground">
        {text}
      </p>
    </TooltipWrap>
  )
}

export function ChatMessageQueue({
  items,
  onUpdate,
  onRemove,
  onSendNow,
  className
}: ChatMessageQueueProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [listCollapsed, setListCollapsed] = useState(false)

  if (items.length === 0) return null

  const startEdit = (item: QueuedMessage) => {
    setEditingId(item.id)
    setEditDraft(item.content)
  }

  const commitEdit = (item: QueuedMessage) => {
    const trimmed = editDraft.trim()
    const hasAttachments = (item.attachments?.length ?? 0) > 0
    if (trimmed || hasAttachments) onUpdate(item.id, trimmed)
    else onRemove(item.id)
    setEditingId(null)
    setEditDraft('')
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5 text-xs">
          <span className="font-medium text-foreground">{items.length} Queued</span>
          <CornerDownLeft className="size-3 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">to Send</span>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-expanded={!listCollapsed}
          aria-controls="chat-message-queue-list"
          onClick={() => setListCollapsed((collapsed) => !collapsed)}
        >
          Start Multitasking
          <ChevronDown
            className={cn('size-3 opacity-70 transition-transform', listCollapsed && '-rotate-90')}
            aria-hidden
          />
        </button>
      </div>

      {!listCollapsed ? (
        <ul id="chat-message-queue-list" className="divide-y divide-border">
          {items.map((item) => {
            const isEditing = editingId === item.id

            return (
              <li
                key={item.id}
                className="group flex min-h-8 items-center gap-2 px-3 py-1 transition-colors hover:bg-accent/60"
              >
                {isEditing ? (
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onBlur={() => commitEdit(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        commitEdit(item)
                      }
                      if (e.key === 'Escape') {
                        setEditingId(null)
                        setEditDraft('')
                      }
                    }}
                    autoFocus
                    rows={1}
                    className="min-h-6 min-w-0 flex-1 resize-none rounded-md border border-border bg-input px-2 py-0.5 text-xs leading-5 text-foreground outline-none focus-visible:border-ring"
                  />
                ) : (
                  <div className="flex min-h-5 min-w-0 flex-1 items-center gap-1.5">
                    {item.attachments && item.attachments.length > 0 ? (
                      <QueuedMessageAttachments attachments={item.attachments} />
                    ) : null}
                    {item.content.trim() ? (
                      <QueuedMessagePreview content={item.content} />
                    ) : item.attachments && item.attachments.length > 0 ? (
                      <p className="line-clamp-1 text-xs leading-5 text-muted-foreground">
                        {item.attachments.length} attachment
                        {item.attachments.length === 1 ? '' : 's'}
                      </p>
                    ) : null}
                  </div>
                )}

                <div
                  className={cn(
                    'flex shrink-0 items-center gap-0.5 transition-opacity',
                    isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                >
                  <TooltipIconButton
                    type="button"
                    variant="ghost"
                    size="iconSm"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    tooltip="Edit"
                    aria-label="Edit queued message"
                    onClick={() => startEdit(item)}
                  >
                    <Pencil className="size-3.5" />
                  </TooltipIconButton>
                  <TooltipIconButton
                    type="button"
                    variant="ghost"
                    size="iconSm"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    tooltip="Send now"
                    aria-label="Send queued message now"
                    onClick={() => onSendNow(item.id)}
                  >
                    <ArrowUp className="size-3.5" />
                  </TooltipIconButton>
                  <TooltipIconButton
                    type="button"
                    variant="ghost"
                    size="iconSm"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    tooltip="Remove"
                    aria-label="Remove from queue"
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </TooltipIconButton>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
