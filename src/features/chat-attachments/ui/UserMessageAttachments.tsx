import { useState } from 'react'
import { ChevronDown, FileText } from '@/shared/ui/icons'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { useAttachmentDisplayUrl } from '@/features/chat-attachments/model/useAttachmentDisplayUrl'
import { AttachmentPreviewDialog } from '@/features/chat-attachments/ui/AttachmentPreviewDialog'
import { DIALOG_CONTENT_CLOSE_MS } from '@/shared/lib/dialog-close-duration'
import { cn } from '@/shared/lib/utils'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'

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

export function UserMessageAttachments({
  attachments,
  className
}: {
  attachments: MessageAttachment[]
  className?: string
}) {
  const [listCollapsed, setListCollapsed] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState<MessageAttachment | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  if (attachments.length === 0) return null

  const openPreview = (item: MessageAttachment) => {
    setPreviewAttachment(item)
    setPreviewOpen(true)
  }

  const handlePreviewOpenChange = (open: boolean) => {
    setPreviewOpen(open)
    if (!open) {
      window.setTimeout(() => setPreviewAttachment(null), DIALOG_CONTENT_CLOSE_MS)
    }
  }

  return (
    <>
      <div
        className={cn(
          'mb-2 overflow-hidden rounded-lg border border-border/80 bg-muted/15',
          className
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between gap-2 px-2.5 py-1.5',
            !listCollapsed && 'border-b border-border/80'
          )}
        >
          <span className="text-[11px] font-medium text-muted-foreground">
            {attachments.length} attachment{attachments.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            className="flex shrink-0 cursor-pointer items-center gap-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={!listCollapsed}
            aria-controls="user-message-attachments-list"
            onClick={() => setListCollapsed((collapsed) => !collapsed)}
          >
            {listCollapsed ? 'Show' : 'Hide'}
            <ChevronDown
              className={cn('size-3 opacity-70 transition-transform', listCollapsed && '-rotate-90')}
              aria-hidden
            />
          </button>
        </div>

        {!listCollapsed ? (
          <CustomScrollArea variant="menu" className="max-h-60">
            <ul id="user-message-attachments-list" className="divide-y divide-border/80">
              {attachments.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex min-h-8 w-full items-center gap-2 px-2.5 py-1 text-left outline-none hover:bg-accent/40 focus-visible:ring-1 focus-visible:ring-ring/50"
                    aria-label={`Preview ${item.name}`}
                    onClick={() => openPreview(item)}
                  >
                    <AttachmentRowThumb item={item} />
                    <span className="min-w-0 truncate text-xs text-muted-foreground" title={item.name}>
                      {item.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
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
