import { useEffect, useRef, useState } from 'react'
import { FileText, X } from '@/shared/ui/icons'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { useAttachmentDisplayUrl } from '@/features/chat-attachments/model/useAttachmentDisplayUrl'
import { AttachmentPreviewDialog } from '@/features/chat-attachments/ui/AttachmentPreviewDialog'
import { DIALOG_CONTENT_CLOSE_MS } from '@/shared/lib/dialog-close-duration'
import { cn } from '@/shared/lib/utils'

function ComposerAttachmentThumb({
  item,
  interactive
}: {
  item: MessageAttachment
  interactive: boolean
}) {
  const src = useAttachmentDisplayUrl(item)
  if (item.kind !== 'image') {
    return (
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded bg-accent text-muted-foreground',
          interactive && 'cursor-pointer'
        )}
      >
        <FileText className="size-3.5" />
      </div>
    )
  }
  if (!src) {
    return <div className="size-8 shrink-0 rounded bg-muted" />
  }
  return (
    <img
      src={src}
      alt={item.name}
      className={cn(
        'size-8 shrink-0 rounded object-cover',
        interactive && 'cursor-pointer'
      )}
    />
  )
}

type Props = {
  items: readonly MessageAttachment[]
  onRemove: (id: string) => void
  className?: string
}

export function ComposerAttachments({ items, onRemove, className }: Props) {
  const [previewAttachment, setPreviewAttachment] = useState<MessageAttachment | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const clearPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (clearPreviewTimerRef.current) clearTimeout(clearPreviewTimerRef.current)
    }
  }, [])

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
      <div className={cn('flex flex-wrap gap-2 px-3.5 pt-3 pb-0', className)}>
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative flex max-w-[140px] items-center gap-1.5 rounded-lg border border-border bg-muted py-1 pl-1 pr-7"
          >
            <button
              type="button"
              className={cn(
                'flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left outline-none',
                'rounded-md focus-visible:ring-2 focus-visible:ring-ring/50'
              )}
              aria-label={`Preview ${item.name}`}
              onClick={() => openPreview(item)}
            >
              <ComposerAttachmentThumb item={item} interactive />
              <span
                className="min-w-0 cursor-pointer truncate text-xs text-muted-foreground"
                title={item.name}
              >
                {item.name}
              </span>
            </button>
            <button
              type="button"
              className="absolute top-0.5 right-0.5 flex size-5 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
              aria-label={`Remove ${item.name}`}
              onClick={(event) => {
                event.stopPropagation()
                onRemove(item.id)
              }}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
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
