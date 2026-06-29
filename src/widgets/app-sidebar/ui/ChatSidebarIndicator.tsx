import { Pin } from '@/shared/ui/icons'
import {
  sidebarChatDotClass,
  sidebarChatDotErrorClass,
  sidebarChatDotSizeClass,
  sidebarChatUnreadDotClass,
  sidebarChatPinIconClass,
  sidebarRowActionSizeClass
} from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
import { cn } from '@/shared/lib/utils'
import { AgentClusterDots } from './AgentClusterDots'

interface ChatSidebarIndicatorProps {
  pinned: boolean
  hasError: boolean
  hasUnreadReply: boolean
  agentActive: boolean
}

/** Status dot, pin icon, or agent animation — pin control lives in {@link ChatListItem}. */
export function ChatSidebarIndicator({
  pinned,
  hasError,
  hasUnreadReply,
  agentActive
}: ChatSidebarIndicatorProps) {
  const showUnreadDot = hasUnreadReply && !agentActive && !hasError

  return (
    <span
      className={cn('flex shrink-0 items-center justify-center', sidebarRowActionSizeClass)}
    >
      {agentActive ? (
        <span className="flex items-center justify-center transition-opacity group-hover/chat:opacity-0">
          <AgentClusterDots />
        </span>
      ) : pinned ? (
        <Pin className={sidebarChatPinIconClass} aria-hidden />
      ) : (
        <span
          className={cn(
            'rounded-full transition-opacity group-hover/chat:opacity-0',
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
    </span>
  )
}
