import { useChatsStore } from '@/entities/chat/model/store'
import { cn } from '@/shared/lib/utils'

type BackgroundStreamHintProps = {
  streamChatId: string
  onOpenChat: (chatId: string) => void
  className?: string
}

export function BackgroundStreamHint({
  streamChatId,
  onOpenChat,
  className
}: BackgroundStreamHintProps) {
  const title =
    useChatsStore((s) => s.chats.find((c) => c.id === streamChatId)?.title)?.trim() ||
    'Another chat'

  return (
    <div
      role="status"
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground',
        className
      )}
    >
      <p className="min-w-0 leading-snug">
        Agent is replying in <span className="text-foreground">{title}</span>.
      </p>
      <button
        type="button"
        className="shrink-0 text-xs font-medium text-foreground hover:underline"
        onClick={() => onOpenChat(streamChatId)}
      >
        Open chat
      </button>
    </div>
  )
}
