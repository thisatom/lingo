import { useEffect, useMemo, useRef, useState } from 'react'
import { Trash2 } from '@/shared/ui/icons'
import { FileText, Paperclip } from 'lucide-react'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { useAttachmentDisplayUrl } from '@/features/chat-attachments/model/useAttachmentDisplayUrl'
import { AttachmentPreviewDialog } from '@/features/chat-attachments/ui/AttachmentPreviewDialog'
import { DIALOG_CONTENT_CLOSE_MS } from '@/shared/lib/dialog-close-duration'
import {
  composerStackPanelShellClass,
  filterAttachmentsByQuery
} from '@/widgets/chat-composer/lib/composer-stack-panel'
import { ComposerStackPanelHeader } from '@/widgets/chat-composer/ui/ComposerStackPanelHeader'
import { cn } from '@/shared/lib/utils'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

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

type Props = {
  items: readonly MessageAttachment[]
  onRemove: (id: string) => void
  /** Inside ChatComposer shell — no outer border, divider below. */
  embedded?: boolean
  className?: string
}

/** Composer attachment list — same panel pattern as ChatMessageQueue. */
export function ComposerAttachmentsPanel({
  items,
  onRemove,
  embedded = false,
  className
}: Props) {
  const [listCollapsed, setListCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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
    if (items.length === 0) {
      setSearchOpen(false)
      setSearchQuery('')
    }
  }, [items.length])

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

  const showHeaderDivider = !embedded || !listCollapsed || searchOpen

  return (
    <>
      <div className={cn(composerStackPanelShellClass(embedded), className)}>
        <div className={cn(showHeaderDivider && 'border-b border-border')}>
          <ComposerStackPanelHeader
            count={items.length}
            countLabel="Attached"
            metaIcon={<Paperclip className="size-3 shrink-0" />}
            metaSuffix="to message"
            listCollapsed={listCollapsed}
            onToggleCollapse={() => setListCollapsed((collapsed) => !collapsed)}
            collapseShowLabel="Show files"
            collapseHideLabel="Hide files"
            listId="composer-attachments-list"
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchOpen={searchOpen}
            onToggleSearch={() =>
              setSearchOpen((open) => {
                if (open) setSearchQuery('')
                return !open
              })
            }
            searchPlaceholder="Search files…"
          />
        </div>

        {!listCollapsed ? (
          <CustomScrollArea variant="menu" className="max-h-60">
            {filteredItems.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No files match your search.</p>
            ) : (
              <ul id="composer-attachments-list" className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <li key={item.id} className="group flex min-h-8 items-center gap-2 px-3 py-1">
                    <button
                      type="button"
                      className="flex min-h-5 min-w-0 flex-1 items-center gap-2 text-left outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                      aria-label={`Preview ${item.name}`}
                      onClick={() => openPreview(item)}
                    >
                      <AttachmentRowThumb item={item} />
                      <span
                        className="truncate text-xs leading-5 text-muted-foreground"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                    </button>
                    <TooltipIconButton
                      type="button"
                      variant="ghost"
                      size="iconSm"
                      className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      tooltip="Remove"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </TooltipIconButton>
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
