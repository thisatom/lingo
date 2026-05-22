import { useState } from 'react'
import { Trash2 } from '@/shared/ui/icons'
import { sidebarRowActionNoHoverBgClass } from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
import type { Chat } from '@/entities/chat/model/types'
import { cn } from '@/shared/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/shared/ui/alert-dialog'
import { SidebarMenuButton, SidebarMenuItem } from '@/shared/ui/sidebar'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'
import {
  sidebarChatActiveTextClass,
  sidebarChatHoverTextClass,
  sidebarChatRowRadiusClass,
  sidebarChatTextClass,
  sidebarRowHeightClass
} from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
import { ChatSidebarIndicator } from './ChatSidebarIndicator'

interface ChatListItemProps {
  chat: Chat
  isActive: boolean
  agentActive: boolean
  onOpen: () => void
  onTogglePin: () => void
  onDelete: () => void
}

export function ChatListItem({
  chat,
  isActive,
  agentActive,
  onOpen,
  onTogglePin,
  onDelete
}: ChatListItemProps) {
  const pinned = Boolean(chat.pinned)
  const hasError = Boolean(chat.hasError)
  const hasUnreadReply = Boolean(chat.hasUnreadReply)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <SidebarMenuItem
        className={cn(
          'group/chat relative',
          sidebarChatRowRadiusClass,
          !isActive && sidebarChatHoverTextClass,
          isActive && 'bg-sidebar-accent'
        )}
      >
        <ChatSidebarIndicator
          pinned={pinned}
          hasError={hasError}
          hasUnreadReply={hasUnreadReply}
          agentActive={agentActive}
          onTogglePin={onTogglePin}
        />

        <SidebarMenuButton
          isActive={isActive}
          className={cn(
            sidebarRowHeightClass,
            'items-center pl-8 pr-8',
            sidebarChatTextClass,
            'bg-transparent hover:bg-transparent',
            sidebarChatActiveTextClass
          )}
          onClick={onOpen}
        >
          <span className="min-w-0 flex-1 truncate leading-none">{chat.title}</span>
        </SidebarMenuButton>

        <TooltipIconButton
          variant="ghost"
          size="icon"
          data-chat-row-action=""
          triggerClassName="absolute top-1/2 right-1 z-10 -translate-y-1/2"
          className={cn(
            'size-7',
            'text-muted-foreground opacity-0 transition-opacity hover:text-foreground',
            sidebarRowActionNoHoverBgClass,
            'group-hover/chat:opacity-100 focus-visible:opacity-100'
          )}
          tooltip="Delete chat"
          aria-label="Delete chat"
          onClick={(e) => {
            e.stopPropagation()
            setDeleteOpen(true)
          }}
        >
          <Trash2 className="size-3.5 shrink-0" />
        </TooltipIconButton>
      </SidebarMenuItem>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{chat.title}&quot; will be removed from your list. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              size="xs"
              variant="destructive"
              onClick={() => {
                onDelete()
                setDeleteOpen(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
