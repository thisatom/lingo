import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, CornerDownLeft, Pencil, Trash2 } from '@/shared/ui/icons'
import type { QueuedMessage } from '@/entities/message-queue/model/store'
import { FieldContextMenu } from '@/features/chat-composer/ui/FieldContextMenu'
import { QueuedMessageAttachments } from '@/features/chat-attachments/ui/QueuedMessageAttachments'
import {
  COMPOSER_STACK_PANEL_DEFAULT_COLLAPSED,
  composerStackPanelShellClass,
  filterQueuedByQuery,
  toggleStackPanelCollapse
} from '@/widgets/chat-composer/lib/composer-stack-panel'
import { useComposerPanelSearch } from '@/widgets/chat-composer/lib/use-composer-panel-search'
import { ComposerStackPanelHeader } from '@/widgets/chat-composer/ui/ComposerStackPanelHeader'
import { cn } from '@/shared/lib/utils'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'
import { TooltipIconButton, TooltipWrap } from '@/shared/ui/tooltip-wrap'

interface ChatMessageQueueProps {
  items: readonly QueuedMessage[]
  onUpdate: (id: string, content: string) => void
  onRemove: (id: string) => void
  onSendNow: (id: string) => void
  /** Inside ChatComposer shell — no outer border, divider below. */
  embedded?: boolean
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
  embedded = false,
  className
}: ChatMessageQueueProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [listCollapsed, setListCollapsed] = useState(COMPOSER_STACK_PANEL_DEFAULT_COLLAPSED)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)
  const {
    searchOpen,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    toggleSearch,
    resetSearch
  } = useComposerPanelSearch()

  const filteredItems = useMemo(
    () => filterQueuedByQuery(items, searchQuery),
    [items, searchQuery]
  )

  useEffect(() => {
    if (items.length === 0) {
      resetSearch()
      setEditingId(null)
      setEditDraft('')
    }
  }, [items.length, resetSearch])

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
    <div className={cn(composerStackPanelShellClass(embedded, className, 'bottom', listCollapsed))}>
      <ComposerStackPanelHeader
        count={items.length}
        countLabel="Queued"
        metaIcon={<CornerDownLeft className="size-3 shrink-0" />}
        metaSuffix="to Send"
        listCollapsed={listCollapsed}
        onToggleCollapse={() =>
          toggleStackPanelCollapse(listCollapsed, setListCollapsed, resetSearch)
        }
        collapseShowLabel="Show queue"
        collapseHideLabel="Hide queue"
        listId="chat-message-queue-list"
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchOpen={searchOpen}
        onSearchClick={() => toggleSearch(() => setListCollapsed(false))}
        searchInputRef={searchInputRef}
        searchPlaceholder="Search queue…"
      />

      {!listCollapsed ? (
        <CustomScrollArea variant="menu" className="max-h-60">
          {filteredItems.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No messages match your search.</p>
          ) : (
            <ul id="chat-message-queue-list" className="divide-y divide-border">
              {filteredItems.map((item) => {
                const isEditing = editingId === item.id

                return (
                  <li key={item.id} className="group flex min-h-8 items-center gap-2 px-3 py-1">
                    {isEditing ? (
                      <FieldContextMenu fieldRef={editTextareaRef} onValueChange={setEditDraft}>
                        <textarea
                          ref={editTextareaRef}
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
                      </FieldContextMenu>
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
                        isEditing
                          ? 'pointer-events-auto opacity-100'
                          : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100'
                      )}
                    >
                      <TooltipIconButton
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        tooltip="Edit"
                        aria-label="Edit queued message"
                        onMouseDown={(event) => event.preventDefault()}
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
                        onMouseDown={(event) => event.preventDefault()}
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
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onRemove(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </TooltipIconButton>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CustomScrollArea>
      ) : null}
    </div>
  )
}
