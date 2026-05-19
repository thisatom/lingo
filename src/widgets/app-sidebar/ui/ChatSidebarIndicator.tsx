import { Pin } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'
import {
  sidebarChatDotClass,
  sidebarChatDotErrorClass,
  sidebarChatDotSizeClass
} from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
import { AgentClusterDots } from './AgentClusterDots'

interface ChatSidebarIndicatorProps {
  pinned: boolean
  hasError: boolean
  agentActive: boolean
  onTogglePin: () => void
}

const pinButtonClass = cn(
  'pointer-events-auto absolute inset-0 size-6 opacity-0 transition-opacity',
  'text-[#a3a3a3] hover:text-[#c8c8c8]',
  'group-hover/chat:opacity-100 focus-visible:opacity-100'
)

export function ChatSidebarIndicator({
  pinned,
  hasError,
  agentActive,
  onTogglePin
}: ChatSidebarIndicatorProps) {
  return (
    <div className="absolute top-1/2 left-1 z-10 flex size-6 -translate-y-1/2 items-center justify-center">
      {agentActive ? (
        <span className="flex items-center justify-center transition-opacity group-hover/chat:opacity-0">
          <AgentClusterDots />
        </span>
      ) : (
        <span
          className={cn(
            'shrink-0 rounded-full transition-opacity group-hover/chat:opacity-0',
            sidebarChatDotSizeClass,
            hasError ? sidebarChatDotErrorClass : sidebarChatDotClass
          )}
          aria-hidden
        />
      )}

      <TooltipIconButton
        variant="ghost"
        size="icon"
        className={cn(pinButtonClass, pinned && 'text-[#d4d4d4]')}
        tooltip={pinned ? 'Unpin chat' : 'Pin chat'}
        aria-pressed={pinned}
        onClick={(e) => {
          e.stopPropagation()
          onTogglePin()
        }}
      >
        <Pin className={cn('size-3.5', pinned && 'fill-current')} />
      </TooltipIconButton>
    </div>
  )
}
