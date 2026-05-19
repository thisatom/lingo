import { MoreHorizontal } from 'lucide-react'
import type { Message } from '@/entities/message/model/types'
import { useChatsStore } from '@/entities/chat/model/store'
import { formatChatMessagesForCopy } from '@/features/chat-actions/lib/format-chat-messages'
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard'
import {
  sidebarMenuItemClass,
  sidebarMenuSurfaceClass
} from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu'

interface ChatHeaderMenuProps {
  chatId: string | null
  messages: Message[]
}

export function ChatHeaderMenu({ chatId, messages }: ChatHeaderMenuProps) {
  const forkChat = useChatsStore((s) => s.forkChat)

  const handleFork = () => {
    if (!chatId) return
    forkChat(chatId)
  }

  const handleCopyMessages = () => {
    const text = formatChatMessagesForCopy(messages)
    if (!text) return
    void copyToClipboard(text)
  }

  const handleCopyRequestId = () => {
    if (!chatId) return
    void copyToClipboard(chatId)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Chat options"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className={cn('w-48 p-1', sidebarMenuSurfaceClass)}
      >
        <DropdownMenuItem className={sidebarMenuItemClass} disabled={!chatId} onSelect={handleFork}>
          Fork chat
        </DropdownMenuItem>
        <DropdownMenuItem
          className={sidebarMenuItemClass}
          disabled={messages.length === 0}
          onSelect={handleCopyMessages}
        >
          Copy messages
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 bg-border/60" />
        <DropdownMenuItem
          className={sidebarMenuItemClass}
          disabled={!chatId}
          onSelect={handleCopyRequestId}
        >
          Copy request ID
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
