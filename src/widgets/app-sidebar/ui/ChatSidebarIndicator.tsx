import { Pin } from '@/shared/ui/icons'
import { sidebarRowActionNoHoverBgClass } from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
import { cn } from '@/shared/lib/utils'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'
import {
  sidebarChatDotClass,
  sidebarChatDotErrorClass,
  sidebarChatDotSizeClass,
  sidebarChatUnreadDotClass
} from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
import { AgentClusterDots } from './AgentClusterDots'

interface ChatSidebarIndicatorProps {
  pinned: boolean
  hasError: boolean
  hasUnreadReply: boolean
  agentActive: boolean
  onTogglePin: () => void
}

const pinTriggerClass = 'pointer-events-auto absolute inset-0 flex items-center justify-center'

const pinButtonClass = cn(
  'size-6 opacity-0 transition-opacity',
  'text-muted-foreground hover:text-foreground',
  sidebarRowActionNoHoverBgClass,
  'group-hover/chat:opacity-100 focus-visible:opacity-100'
)

export function ChatSidebarIndicator({
  pinned,
  hasError,
  hasUnreadReply,
  agentActive,
  onTogglePin
}: ChatSidebarIndicatorProps) {
  const showUnreadDot = hasUnreadReply && !agentActive && !hasError

  return (
    <div className="absolute top-1/2 left-1 z-10 size-6 -translate-y-1/2">
      {agentActive ? (
        <span className="absolute inset-0 flex items-center justify-center transition-opacity group-hover/chat:opacity-0">
          <AgentClusterDots />
        </span>
      ) : (
        <span
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity',
            !showUnreadDot && !hasError && 'group-hover/chat:opacity-0',
            sidebarChatDotSizeClass,
            hasError
              ? sidebarChatDotErrorClass
              : showUnreadDot
                ? sidebarChatUnreadDotClass
                : sidebarChatDotClass
          )}
          aria-hidden={!showUnreadDot}
          aria-label={showUnreadDot ? 'New reply' : undefined}
        />
      )}

      <TooltipIconButton
        variant="ghost"
        size="icon"
        data-chat-row-action=""
        triggerClassName={pinTriggerClass}
        className={cn(pinButtonClass, pinned && 'text-sidebar-accent-foreground')}
        tooltip={pinned ? 'Unpin chat' : 'Pin chat'}
        aria-pressed={pinned}
        onClick={(e) => {
          e.stopPropagation()
          onTogglePin()
        }}
      >
        <Pin className="size-3.5 shrink-0" />
      </TooltipIconButton>
    </div>
  )
}
