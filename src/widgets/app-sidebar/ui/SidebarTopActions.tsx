import { ArrowLeft, ArrowRight, PanelLeft, Search } from '@/shared/ui/icons'
import { sidebarChromeIconButtonClass } from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
import { useResizableSidebar } from '@/app/context/resizable-sidebar-context'
import { EMPTY_CHAT_HISTORY, useChatsStore } from '@/entities/chat/model/store'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

interface SidebarTopActionsProps {
  onOpenSearch: () => void
}

export function SidebarTopActions({ onOpenSearch }: SidebarTopActionsProps) {
  const { toggleSidebarPanel, sidebarCollapsed } = useResizableSidebar()
  const chatHistoryPast = useChatsStore((s) => s.chatHistoryPast ?? EMPTY_CHAT_HISTORY)
  const chatHistoryFuture = useChatsStore((s) => s.chatHistoryFuture ?? EMPTY_CHAT_HISTORY)
  const goBackInChatHistory = useChatsStore((s) => s.goBackInChatHistory)
  const goForwardInChatHistory = useChatsStore((s) => s.goForwardInChatHistory)

  const canGoBack = chatHistoryPast.length > 0
  const canGoForward = chatHistoryFuture.length > 0

  if (sidebarCollapsed) return null

  return (
    <div className="flex items-center gap-0.5 px-1">
      <TooltipIconButton
        variant="ghost"
        size="icon"
        className={sidebarChromeIconButtonClass}
        tooltip="Hide sidebar"
        onClick={toggleSidebarPanel}
      >
        <PanelLeft className="size-4 shrink-0" />
      </TooltipIconButton>

      <TooltipIconButton
        variant="ghost"
        size="icon"
        className={sidebarChromeIconButtonClass}
        aria-label="Search chats"
        tooltip={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span>Search chats</span>
            <KbdGroup className="opacity-90" aria-hidden>
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </span>
        }
        onClick={onOpenSearch}
      >
        <Search className="size-4 shrink-0" />
      </TooltipIconButton>

      <div className="min-w-0 flex-1" />

      <TooltipIconButton
        variant="ghost"
        size="icon"
        className={sidebarChromeIconButtonClass}
        disabled={!canGoBack}
        tooltip="Previous chat"
        onClick={goBackInChatHistory}
      >
        <ArrowLeft className="size-4 shrink-0" />
      </TooltipIconButton>
      <TooltipIconButton
        variant="ghost"
        size="icon"
        className={sidebarChromeIconButtonClass}
        disabled={!canGoForward}
        tooltip="Next chat"
        onClick={goForwardInChatHistory}
      >
        <ArrowRight className="size-4 shrink-0" />
      </TooltipIconButton>
    </div>
  )
}
