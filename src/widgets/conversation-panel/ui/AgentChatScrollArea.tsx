import type { ReactNode } from 'react'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'

interface AgentChatScrollAreaProps {
  children: ReactNode
  className?: string
  onAtBottomChange?: (atBottom: boolean) => void
  onShowScrollToLatestChange?: (show: boolean) => void
}

export function AgentChatScrollArea({
  children,
  className,
  onAtBottomChange,
  onShowScrollToLatestChange
}: AgentChatScrollAreaProps) {
  return (
    <CustomScrollArea
      variant="chat"
      className={className}
      onAtBottomChange={onAtBottomChange}
      onShowScrollToLatestChange={onShowScrollToLatestChange}
    >
      {children}
    </CustomScrollArea>
  )
}
