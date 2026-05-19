import { useState } from 'react'
import { Pin, Trash2 } from 'lucide-react'
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
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <SidebarMenuItem className="group/chat relative">
        <TooltipIconButton
          variant="ghost"
          size="icon"
          className={cn(
            'absolute top-1/2 left-1 z-10 size-6 -translate-y-1/2',
            'opacity-0 transition-opacity',
            'group-hover/chat:opacity-100 focus-visible:opacity-100',
            pinned && 'text-foreground'
          )}
          tooltip={pinned ? 'Unpin chat' : 'Pin chat'}
          aria-pressed={pinned}
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin()
          }}
        >
          <Pin className={cn('size-3.5', pinned && 'fill-current')} />
        </TooltipIconButton>

        <SidebarMenuButton isActive={isActive} className="pl-8 pr-8" onClick={onOpen}>
          <span className="truncate">{chat.title}</span>
        </SidebarMenuButton>

        <TooltipIconButton
          variant="ghost"
          size="icon"
          className={cn(
            'absolute top-1/2 right-1 z-10 size-7 -translate-y-1/2',
            'opacity-0 transition-opacity',
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
