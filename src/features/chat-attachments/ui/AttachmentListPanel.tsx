import { useEffect, useMemo, useRef, useState } from 'react'
import { Trash2 } from '@/shared/ui/icons'
import { FileText, Paperclip } from 'lucide-react'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { useAttachmentDisplayUrl } from '@/features/chat-attachments/model/useAttachmentDisplayUrl'
import { AttachmentPreviewDialog } from '@/features/chat-attachments/ui/AttachmentPreviewDialog'
import { DIALOG_CONTENT_CLOSE_MS } from '@/shared/lib/dialog-close-duration'
import {
  COMPOSER_STACK_PANEL_DEFAULT_COLLAPSED,
  composerStackPanelShellClass,
  filterAttachmentsByQuery,
  toggleStackPanelCollapse
} from '@/widgets/chat-composer/lib/composer-stack-panel'
import { useComposerPanelSearch } from '@/widgets/chat-composer/lib/use-composer-panel-search'
import { ComposerStackPanelHeader } from '@/widgets/chat-composer/ui/ComposerStackPanelHeader'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'
import { TooltipIconButton, TooltipWrap } from '@/shared/ui/tooltip-wrap'

function AttachmentRowThumb({ item }: { item: MessageAttachment }) {
  const src = useAttachmentDisplayUrl(item)
  if (item.kind !== 'image') {
    return (
      <span className="flex size-4 shrink-0 items-center justify-center rounded bg-accent">
        <FileText className="size-2.5" />
      </span>
    )
  }
  if (!src) return <span className="size-4 shrink-0 rounded bg-muted" />
  return <img src={src} alt="" className="size-4 shrink-0 rounded object-cover" />
}

export type AttachmentListPanelProps = {
  items: readonly MessageAttachment[]
  onRemove?: (id: string) => void
  /** Inside a parent shell — divider instead of outer border. */
  embedded?: boolean
  /** Divider edge when embedded (composer panels sit above input). */
  embeddedDivider?: 'top' | 'bottom'
  /** Preview-only list (e.g. sent user message). */
  readOnly?: boolean
  metaSuffix?: string
  listId?: string
  className?: string
}

/** Shared attachment list — composer input, user message block, etc. */
export function AttachmentListPanel({
  items,
  onRemove,
  embedded = false,
  embeddedDivider = 'bottom',
  readOnly = false,
  metaSuffix = 'to message',
  listId = 'attachment-list',
  className
}: AttachmentListPanelProps) {
  const [listCollapsed, setListCollapsed] = useState(COMPOSER_STACK_PANEL_DEFAULT_COLLAPSED)
  const {
    searchOpen,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    toggleSearch,
    resetSearch
  } = useComposerPanelSearch()
  const [previewAttachment, setPreviewAttachment] = useState<MessageAttachment | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const clearPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filteredItems = useMemo(
    () => filterAttachmentsByQuery(items, searchQuery),
    [items, searchQuery]
  )

  useEffect(() => {
    return () => {
      if (clearPreviewTimerRef.current) clearTimeout(clearPreviewTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (items.length === 0) resetSearch()
  }, [items.length, resetSearch])

  const openPreview = (item: MessageAttachment) => {
    if (clearPreviewTimerRef.current) {
      clearTimeout(clearPreviewTimerRef.current)
      clearPreviewTimerRef.current = null
    }
    setPreviewAttachment(item)
    setPreviewOpen(true)
  }

  const handlePreviewOpenChange = (open: boolean) => {
    setPreviewOpen(open)
    if (clearPreviewTimerRef.current) {
      clearTimeout(clearPreviewTimerRef.current)
      clearPreviewTimerRef.current = null
    }
    if (!open) {
      clearPreviewTimerRef.current = setTimeout(() => {
        setPreviewAttachment(null)
        clearPreviewTimerRef.current = null
      }, DIALOG_CONTENT_CLOSE_MS)
    }
  }

  if (items.length === 0) return null

  return (
    <>
      <div
        className={composerStackPanelShellClass(
          embedded,
          className,
          embeddedDivider,
          listCollapsed
        )}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <ComposerStackPanelHeader
          count={items.length}
          countLabel="Attached"
          metaIcon={<Paperclip className="size-3 shrink-0" />}
          metaSuffix={metaSuffix}
          listCollapsed={listCollapsed}
          onToggleCollapse={() =>
            toggleStackPanelCollapse(listCollapsed, setListCollapsed, resetSearch)
          }
          collapseShowLabel="Show files"
          collapseHideLabel="Hide files"
          listId={listId}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchOpen={searchOpen}
          onSearchClick={() => toggleSearch(() => setListCollapsed(false))}
          searchInputRef={searchInputRef}
          searchPlaceholder="Search files…"
        />

        {!listCollapsed ? (
          <CustomScrollArea variant="menu" className="max-h-60">
            {filteredItems.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No files match your search.</p>
            ) : (
              <ul id={listId} className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <li key={item.id} className="group flex min-h-8 items-center gap-2 px-3 py-1">
                    <TooltipWrap label={item.name} side="top" align="start" contentClassName="max-w-sm break-all">
                      <button
                        type="button"
                        className="flex min-h-5 min-w-0 flex-1 items-center gap-2 text-left outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                        aria-label={`Preview ${item.name}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          openPreview(item)
                        }}
                      >
                        <AttachmentRowThumb item={item} />
                        <span className="truncate text-xs leading-5 text-muted-foreground">
                          {item.name}
                        </span>
                      </button>
                    </TooltipWrap>
                    {!readOnly && onRemove ? (
                      <TooltipIconButton
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                        tooltip="Remove"
                        aria-label={`Remove ${item.name}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          onRemove(item.id)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </TooltipIconButton>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CustomScrollArea>
        ) : null}
      </div>

      {previewAttachment ? (
        <AttachmentPreviewDialog
          attachment={previewAttachment}
          open={previewOpen}
          onOpenChange={handlePreviewOpenChange}
        />
      ) : null}
    </>
  )
}
