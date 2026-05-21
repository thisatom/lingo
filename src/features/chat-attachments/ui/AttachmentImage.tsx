import type { MessageAttachment } from '@/entities/message/model/attachment'
import { useAttachmentDisplayUrl } from '@/features/chat-attachments/model/useAttachmentDisplayUrl'
import { cn } from '@/shared/lib/utils'

type Props = {
  attachment: MessageAttachment
  className?: string
  imgClassName?: string
}

export function AttachmentImage({ attachment, className, imgClassName }: Props) {
  const src = useAttachmentDisplayUrl(attachment)

  if (!src) {
    return (
      <div
        className={cn(
          'flex h-24 min-w-[6rem] items-center justify-center rounded-lg border border-border bg-muted/40 text-[11px] text-muted-foreground',
          className
        )}
      >
        …
      </div>
    )
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className={cn('block overflow-hidden rounded-lg border border-border', className)}
    >
      <img
        src={src}
        alt={attachment.name}
        className={cn('max-h-40 max-w-full object-contain', imgClassName)}
      />
    </a>
  )
}
