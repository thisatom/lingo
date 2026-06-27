import { useState } from 'react'
import { Pin, Trash2 } from '@/shared/ui/icons'
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
  sidebarChatRowRadiusClass,
  sidebarChatTextClass,
  sidebarChatTitleFadeClass,
  sidebarChatTitleScrimClass,
  sidebarRowActionNoHoverBgClass,
  sidebarTextFadeClass,
  sidebarRowActionSizeClass,
  sidebarRowHeightClass
} from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
import { ChatSidebarIndicator } from './ChatSidebarIndicator'

interface ChatListItemProps {
  chat: Chat
  isActive: boolean
  onOpen: () => void
  onTogglePin: () => void
  onDelete: () => void
}

const pinTriggerClass = cn(
  'absolute left-0 top-1/2 z-10 -translate-y-1/2',
  'pointer-events-none opacity-0',
  'group-hover/chat:pointer-events-auto group-hover/chat:opacity-100',
  'focus-visible:pointer-events-auto focus-visible:opacity-100'
)

const pinButtonClass = cn(
  sidebarRowActionSizeClass,
  'relative z-[2] transition-opacity',
  'rounded-lg border-0 bg-transparent text-muted-foreground/55 shadow-none',
  'hover:!bg-transparent hover:!text-foreground active:!bg-transparent',
  sidebarRowActionNoHoverBgClass
)

export function ChatListItem({
  chat,
  isActive,
  onOpen,
  onTogglePin,
  onDelete
}: ChatListItemProps) {
  const agentActive = isSidebarAgentStage(useChatPipelineStage(chat.id))
  const pinned = Boolean(chat.pinned)
  const hasError = Boolean(chat.hasError)
  const hasUnreadReply = Boolean(chat.hasUnreadReply)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
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
            'flex w-full items-center gap-1.5 !px-0 !py-0 pr-[30px]',
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
            pinButtonClass,
            pinned && 'pointer-events-auto opacity-100 text-sidebar-accent-foreground'
          )}
          tooltip={pinned ? 'Unpin chat' : 'Pin chat'}
          aria-pressed={pinned}
          aria-label={pinned ? 'Unpin chat' : 'Pin chat'}
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin()
          }}
        >
          <Pin className="size-3.5 shrink-0" />
        </TooltipIconButton>

        <TooltipIconButton
          variant="ghost"
          size="icon"
          data-chat-row-action=""
          triggerClassName="pointer-events-none absolute top-1/2 right-0 z-10 -translate-y-1/2 group-hover/chat:pointer-events-auto focus-visible:pointer-events-auto"
          className={cn(
            sidebarRowActionSizeClass,
            sidebarChatDeleteButtonClass,
            'pointer-events-none'
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
