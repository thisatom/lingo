import { Pin, Trash2 } from 'lucide-react'
import type { Chat } from '@/entities/chat/model/types'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { SidebarMenuButton, SidebarMenuItem } from '@/shared/ui/sidebar'

interface ChatListItemProps {
  chat: Chat
  isActive: boolean
  onOpen: () => void
  onTogglePin: () => void
  onDelete: () => void
}

export function ChatListItem({
  chat,
  isActive,
  onOpen,
  onTogglePin,
  onDelete
}: ChatListItemProps) {
  const pinned = Boolean(chat.pinned)

  return (
    <SidebarMenuItem className="group/chat relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          'absolute top-1/2 left-1 z-10 size-6 -translate-y-1/2',
          'opacity-0 transition-opacity',
          'group-hover/chat:opacity-100 focus-visible:opacity-100',
          pinned && 'text-foreground'
        )}
        title={pinned ? 'Unpin chat' : 'Pin chat'}
        aria-label={pinned ? 'Unpin chat' : 'Pin chat'}
        aria-pressed={pinned}
        onClick={(e) => {
          e.stopPropagation()
          onTogglePin()
        }}
      >
        <Pin className={cn('size-3.5', pinned && 'fill-current')} />
      </Button>

      <SidebarMenuButton isActive={isActive} className="pl-8 pr-8" onClick={onOpen}>
        <span className="truncate">{chat.title}</span>
      </SidebarMenuButton>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          'absolute top-1/2 right-1 z-10 size-7 -translate-y-1/2',
          'opacity-0 transition-opacity',
          'group-hover/chat:opacity-100 focus-visible:opacity-100'
        )}
        title="Delete chat"
        aria-label="Delete chat"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </SidebarMenuItem>
  )
}
