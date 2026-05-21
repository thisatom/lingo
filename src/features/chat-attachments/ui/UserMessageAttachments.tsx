import { FileText } from 'lucide-react'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { cn } from '@/shared/lib/utils'

export function UserMessageAttachments({
  attachments,
  className
}: {
  attachments: MessageAttachment[]
  className?: string
}) {
  if (attachments.length === 0) return null

  return (
    <div className={cn('mb-2 flex flex-wrap gap-2', className)}>
      {attachments.map((item) =>
        item.kind === 'image' ? (
          <a
            key={item.id}
            href={item.payload}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-lg border border-border"
          >
            <img
              src={item.payload}
              alt={item.name}
              className="max-h-40 max-w-full object-contain"
            />
          </a>
        ) : (
          <div
            key={item.id}
            className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground"
            title={item.name}
          >
            <FileText className="size-3 shrink-0" />
            <span className="truncate">{item.name}</span>
          </div>
        )
      )}
    </div>
  )
}
