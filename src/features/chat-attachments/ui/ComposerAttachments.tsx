import { FileText, X } from '@/shared/ui/icons'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { useAttachmentDisplayUrl } from '@/features/chat-attachments/model/useAttachmentDisplayUrl'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

function ComposerAttachmentThumb({ item }: { item: MessageAttachment }) {
  const src = useAttachmentDisplayUrl(item)
  if (item.kind !== 'image') {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded bg-accent text-muted-foreground">
        <FileText className="size-3.5" />
      </div>
    )
  }
  if (!src) {
    return <div className="size-8 shrink-0 rounded bg-muted" />
  }
  return <img src={src} alt={item.name} className="size-8 shrink-0 rounded object-cover" />
}

type Props = {
  items: readonly MessageAttachment[]
  onRemove: (id: string) => void
  className?: string
}

export function ComposerAttachments({ items, onRemove, className }: Props) {
  if (items.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2 px-3.5 pt-3 pb-0', className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative flex max-w-[140px] items-center gap-1.5 rounded-lg border border-border bg-muted py-1 pl-1 pr-7"
        >
          <ComposerAttachmentThumb item={item} />
          <span className="min-w-0 truncate text-xs text-muted-foreground" title={item.name}>
            {item.name}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="iconSm"
            className="absolute top-0.5 right-0.5 size-5 text-muted-foreground hover:text-foreground"
            aria-label={`Remove ${item.name}`}
            onClick={() => onRemove(item.id)}
          >
            <X className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}
