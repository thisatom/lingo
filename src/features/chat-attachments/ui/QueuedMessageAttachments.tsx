import { FileText } from 'lucide-react'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { cn } from '@/shared/lib/utils'

type Props = {
  attachments: readonly MessageAttachment[]
  className?: string
}

/** Compact attachment chips for the message queue panel. */
export function QueuedMessageAttachments({ attachments, className }: Props) {
  if (attachments.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {attachments.map((item) => (
        <span
          key={item.id}
          className="inline-flex max-w-[120px] items-center gap-1 rounded border border-border bg-muted py-0.5 pl-0.5 pr-1.5 text-[10px] text-muted-foreground"
          title={item.name}
        >
          {item.kind === 'image' ? (
            <img
              src={item.payload}
              alt=""
              className="size-4 shrink-0 rounded object-cover"
            />
          ) : (
            <span className="flex size-4 shrink-0 items-center justify-center rounded bg-accent">
              <FileText className="size-2.5" />
            </span>
          )}
          <span className="truncate">{item.name}</span>
        </span>
      ))}
    </div>
  )
}
