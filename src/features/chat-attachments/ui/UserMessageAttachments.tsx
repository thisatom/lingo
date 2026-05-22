import { FileText } from '@/shared/ui/icons'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { AttachmentImage } from '@/features/chat-attachments/ui/AttachmentImage'
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
          <AttachmentImage key={item.id} attachment={item} />
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
