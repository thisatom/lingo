import { useState } from 'react'
import { Archive, Pin, Trash2 } from '@/shared/ui/icons'
import type { Chat } from '@/entities/chat/model/types'
import { cn } from '@/shared/lib/utils'
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog'
import { SidebarMenuButton, SidebarMenuItem } from '@/shared/ui/sidebar'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'
import { useChatPipelineStage } from '@/features/ai-chat/lib/use-chat-pipeline'
import {
  isSidebarAgentStage,
  sidebarChatActiveTextClass,
  sidebarChatDeleteButtonClass,
  sidebarChatHoverTextClass,
  sidebarChatPinActionClass,
  sidebarChatPinPinnedClass,
  sidebarChatPinIconClass,
  sidebarChatRowActionsPaddingClass,
  sidebarChatRowActionsPanelClass,
  sidebarChatRowActionsShadowClass,
  sidebarChatRowRadiusClass,
  sidebarChatTextClass,
  sidebarChatTitleFadeClass,
  sidebarChatTitleScrimClass,
  sidebarTextFadeClass,
  sidebarRowHeightClass
} from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
import { ChatListItemContextMenu } from './ChatListItemContextMenu'
import { ChatSidebarIndicator } from './ChatSidebarIndicator'

interface ChatListItemProps {
  chat: Chat
  isActive: boolean
  onOpen: () => void
  onTogglePin: () => void
  onArchive: () => void
  onDelete: () => void
}

const pinTriggerClass = cn(
  'absolute left-0 top-1/2 z-10 flex size-[30px] -translate-y-1/2 items-center justify-center',
  'pointer-events-none opacity-0',
  'group-hover/chat:pointer-events-auto group-hover/chat:opacity-100',
  'focus-visible:pointer-events-auto focus-visible:opacity-100'
)

const rowActionTriggerClass =
  'absolute top-1/2 z-[2] -translate-y-1/2 focus-visible:pointer-events-auto'

export function ChatListItem({
  chat,
  isActive,
  onOpen,
  onTogglePin,
  onArchive,
  onDelete
}: ChatListItemProps) {
  const agentActive = isSidebarAgentStage(useChatPipelineStage(chat.id))
  const pinned = Boolean(chat.pinned)
  const archived = Boolean(chat.archived)
  const hasError = Boolean(chat.hasError)
  const hasUnreadReply = Boolean(chat.hasUnreadReply)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <ChatListItemContextMenu chat={chat} onArchive={onArchive}>
        <SidebarMenuItem
          data-active={isActive ? true : undefined}
          className={cn(
            'group/chat relative overflow-hidden',
            sidebarChatRowRadiusClass,
            !isActive && sidebarChatHoverTextClass,
            isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
          )}
        >
          <SidebarMenuButton
            isActive={isActive}
            className={cn(
              sidebarRowHeightClass,
              'flex w-full items-center gap-1.5 !px-0 !py-0',
              sidebarChatRowActionsPaddingClass,
              sidebarChatTextClass,
              'rounded-lg bg-transparent hover:bg-transparent active:bg-transparent',
              sidebarChatActiveTextClass
            )}
            onClick={onOpen}
          >
            <ChatSidebarIndicator
              pinned={pinned}
              hasError={hasError}
              hasUnreadReply={hasUnreadReply}
              agentActive={agentActive}
            />
            <span className={sidebarChatTitleFadeClass}>
              <span className={sidebarTextFadeClass}>{chat.title}</span>
              <span className={sidebarChatTitleScrimClass} aria-hidden />
            </span>
          </SidebarMenuButton>

          <TooltipIconButton
            variant="ghost"
            size="icon"
            data-chat-row-action=""
            triggerClassName={pinTriggerClass}
            className={cn(
              sidebarChatPinActionClass,
              pinned ? sidebarChatPinPinnedClass : null
            )}
            tooltip={pinned ? 'Unpin chat' : 'Pin chat'}
            aria-pressed={pinned}
            aria-label={pinned ? 'Unpin chat' : 'Pin chat'}
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin()
            }}
          >
            <Pin className={sidebarChatPinIconClass} />
          </TooltipIconButton>

          <div className={sidebarChatRowActionsPanelClass}>
            <span className={sidebarChatRowActionsShadowClass} aria-hidden />
            <TooltipIconButton
              variant="ghost"
              size="icon"
              data-chat-row-action=""
              triggerClassName={cn(rowActionTriggerClass, 'right-[30px]')}
              className={sidebarChatDeleteButtonClass}
              tooltip={archived ? 'Unarchive chat' : 'Archive chat'}
              aria-label={archived ? 'Unarchive chat' : 'Archive chat'}
              onClick={(e) => {
                e.stopPropagation()
                onArchive()
              }}
            >
              <Archive className="size-3.5 shrink-0" />
            </TooltipIconButton>

            <TooltipIconButton
              variant="ghost"
              size="icon"
              data-chat-row-action=""
              triggerClassName={cn(rowActionTriggerClass, 'right-0')}
              className={sidebarChatDeleteButtonClass}
              tooltip="Delete chat"
              aria-label="Delete chat"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteOpen(true)
              }}
            >
              <Trash2 className="size-3.5 shrink-0" />
            </TooltipIconButton>
          </div>
        </SidebarMenuItem>
      </ChatListItemContextMenu>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this chat?"
        description={
          <>
            <span className="font-medium text-foreground">&quot;{chat.title}&quot;</span> will be
            removed from your list. This cannot be undone.
          </>
        }
        primaryLabel="Delete"
        primaryVariant="destructive"
        onPrimary={() => {
          onDelete()
          setDeleteOpen(false)
        }}
      />
    </>
  )
}
