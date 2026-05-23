import type { ReactNode } from 'react'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'

interface AgentChatScrollAreaProps {
  children: ReactNode
  className?: string
  /** Remounts internal scroll UI state when the active chat changes. */
  scrollSessionKey?: string | null
  onAtBottomChange?: (atBottom: boolean) => void
  onShowScrollToLatestChange?: (show: boolean) => void
  onViewportRef?: (viewport: HTMLDivElement | null) => void
  onViewportScroll?: (viewport: HTMLDivElement) => void
}

export function AgentChatScrollArea({
  children,
  className,
  scrollSessionKey,
  onAtBottomChange,
  onShowScrollToLatestChange,
  onViewportRef,
  onViewportScroll
}: AgentChatScrollAreaProps) {
  return (
    <CustomScrollArea
      variant="chat"
      scrollSessionKey={scrollSessionKey}
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
