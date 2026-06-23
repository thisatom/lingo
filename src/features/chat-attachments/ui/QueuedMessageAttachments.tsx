import { FileText, X } from '@/shared/ui/icons'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { useAttachmentDisplayUrl } from '@/features/chat-attachments/model/useAttachmentDisplayUrl'
import { TooltipWrap } from '@/shared/ui/tooltip-wrap'
import { cn } from '@/shared/lib/utils'

function QueueAttachmentThumb({ item }: { item: MessageAttachment }) {
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
  attachments: readonly MessageAttachment[]
  className?: string
  onRemove?: (id: string) => void
  onOpen?: (item: MessageAttachment) => void
}

/** Compact attachment chips (composer queue + message queue). */
export function QueuedMessageAttachments({ attachments, className, onRemove, onOpen }: Props) {
  if (attachments.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {attachments.map((item) => {
        const interactive = Boolean(onOpen)
        const body = (
          <>
            <QueueAttachmentThumb item={item} />
            <span className="truncate">{item.name}</span>
          </>
        )

        return (
          <TooltipWrap
            key={item.id}
            label={item.name}
            side="top"
            contentClassName="max-w-sm break-all"
          >
            <span className="inline-flex max-w-[140px] items-center gap-0.5 rounded border border-border bg-muted py-0.5 pl-0.5 pr-0.5 text-[10px] text-muted-foreground">
            {interactive ? (
              <button
                type="button"
                className="inline-flex min-w-0 flex-1 items-center gap-1 rounded-sm px-0.5 text-left outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                aria-label={`Preview ${item.name}`}
                onClick={() => onOpen?.(item)}
              >
                {body}
              </button>
            ) : (
              <span className="inline-flex min-w-0 flex-1 items-center gap-1 px-0.5">{body}</span>
            )}
            {onRemove ? (
              <button
                type="button"
                className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                aria-label={`Remove ${item.name}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove(item.id)
                }}
              >
                <X className="size-2.5" />
              </button>
            ) : null}
            </span>
          </TooltipWrap>
        )
      })}
    </div>
  )
}
