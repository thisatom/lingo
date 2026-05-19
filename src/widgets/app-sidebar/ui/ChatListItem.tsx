import { useState } from 'react'
import { Trash2 } from 'lucide-react'
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
  sidebarChatTextClass
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
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <SidebarMenuItem className="group/chat relative">
        <ChatSidebarIndicator
          pinned={pinned}
          hasError={hasError}
          agentActive={agentActive}
          onTogglePin={onTogglePin}
        />

        <SidebarMenuButton
          isActive={isActive}
          className={cn(
            'h-8 pl-8 pr-8',
            sidebarChatRowRadiusClass,
            sidebarChatTextClass,
            sidebarChatHoverTextClass,
            sidebarChatActiveTextClass
          )}
          onClick={onOpen}
        >
          <span className="truncate">{chat.title}</span>
        </SidebarMenuButton>

        <TooltipIconButton
          variant="ghost"
          size="icon"
          className={cn(
            'absolute top-1/2 right-1 z-10 size-7 -translate-y-1/2',
            'text-[#a3a3a3] opacity-0 transition-opacity hover:text-[#c8c8c8]',
            'group-hover/chat:opacity-100 focus-visible:opacity-100'
          )}
          tooltip="Delete chat"
          aria-label="Delete chat"
          onClick={(e) => {
            e.stopPropagation()
            setDeleteOpen(true)
          }}
        >
          <Trash2 className="size-3.5" />
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
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
