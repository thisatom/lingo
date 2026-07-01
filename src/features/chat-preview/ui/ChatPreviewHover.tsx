import type { ReactNode } from 'react'
import type { Chat } from '@/entities/chat/model/types'
import {
  countChatMessages,
  getChatPreviewSnippet
} from '@/features/chat-preview/lib/chat-preview-snippet'
import { formatChatTimeLabel } from '@/shared/lib/chat-sidebar'
import { cn } from '@/shared/lib/utils'
import { linkPreviewPopoverSurfaceClass } from '@/shared/ui/link-preview-card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/shared/ui/hover-card'
import { Pin } from '@/shared/ui/icons'

export const chatPreviewPopoverSurfaceClass = cn(
  linkPreviewPopoverSurfaceClass,
  'w-[min(22rem,calc(100vw-2rem))]'
)

interface ChatPreviewCardProps {
  chat: Chat
  className?: string
}

export function ChatPreviewCard({ chat, className }: ChatPreviewCardProps) {
  const snippet = getChatPreviewSnippet(chat)
  const messageCount = countChatMessages(chat)

  return (
    <div className={cn('flex flex-col gap-2 p-3', className)}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            {chat.pinned ? <Pin className="size-3.5 shrink-0 text-muted-foreground" /> : null}
            <p className="truncate text-sm font-medium text-foreground">{chat.title}</p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {formatChatTimeLabel(chat.updatedAt)}
            {messageCount > 0 ? ` · ${messageCount} messages` : ' · No messages yet'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {chat.archived ? (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              archived
            </span>
          ) : null}
          {chat.hasUnreadReply ? (
            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              unread
            </span>
          ) : null}
          {chat.hasError ? (
            <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
              error
            </span>
          ) : null}
        </div>
      </div>

      {snippet ? (
        <p className="line-clamp-4 text-sm leading-snug text-muted-foreground">{snippet}</p>
      ) : (
        <p className="text-sm leading-snug text-muted-foreground/80">Start a conversation…</p>
      )}
    </div>
  )
}

interface ChatPreviewHoverProps {
  chat: Chat
  children: ReactNode
}

export function ChatPreviewHover({ chat, children }: ChatPreviewHoverProps) {
  return (
    <HoverCard openDelay={350} closeDelay={120}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        className={cn(chatPreviewPopoverSurfaceClass, '!p-0')}
        side="right"
        align="start"
        sideOffset={10}
        collisionPadding={12}
      >
        <ChatPreviewCard chat={chat} />
      </HoverCardContent>
    </HoverCard>
  )
}
