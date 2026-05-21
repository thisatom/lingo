import type { ReactNode } from 'react'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'

interface AgentChatScrollAreaProps {
  children: ReactNode
  className?: string
  onAtBottomChange?: (atBottom: boolean) => void
  onShowScrollToLatestChange?: (show: boolean) => void
  onViewportRef?: (viewport: HTMLDivElement | null) => void
  onViewportScroll?: (viewport: HTMLDivElement) => void
}

export function AgentChatScrollArea({
  children,
  className,
  onAtBottomChange,
  onShowScrollToLatestChange,
  onViewportRef,
  onViewportScroll
}: AgentChatScrollAreaProps) {
  return (
    <CustomScrollArea
      variant="chat"
      className={className}
      onAtBottomChange={onAtBottomChange}
      onShowScrollToLatestChange={onShowScrollToLatestChange}
      onViewportRef={onViewportRef}
      onViewportScroll={onViewportScroll}
    >
      {children}
    </CustomScrollArea>
  )
}
