import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, NewChat, PanelLeftClose, Search } from '@/shared/ui/icons'
import { sidebarChromeIconButtonClass } from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
import { useResizableSidebar } from '@/app/context/resizable-sidebar-context'
import { EMPTY_CHAT_HISTORY, useChatsStore } from '@/entities/chat/model/store'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

interface SidebarTopActionsProps {
  onNewChat: () => void
}

export function SidebarTopActions({ onNewChat }: SidebarTopActionsProps) {
  const { toggleSidebarPanel, openChatSearch } = useResizableSidebar()
  const chatHistoryPast = useChatsStore((s) => s.chatHistoryPast ?? EMPTY_CHAT_HISTORY)
  const chatHistoryFuture = useChatsStore((s) => s.chatHistoryFuture ?? EMPTY_CHAT_HISTORY)
  const goBackInChatHistory = useChatsStore((s) => s.goBackInChatHistory)
  const goForwardInChatHistory = useChatsStore((s) => s.goForwardInChatHistory)

  const canGoBack = chatHistoryPast.length > 0
  const canGoForward = chatHistoryFuture.length > 0

  const shortcutTooltip = (label: string, keys: ReactNode) => (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span>{label}</span>
      {keys}
    </span>
  )

  return (
    <div className="flex min-h-8 min-w-0 items-center gap-0.5">
      <TooltipIconButton
        variant="ghost"
        size="icon-sm"
        className={sidebarChromeIconButtonClass}
        tooltip="Hide sidebar"
        aria-label="Hide sidebar"
        onClick={toggleSidebarPanel}
      >
        <PanelLeftClose className="size-4 shrink-0" />
      </TooltipIconButton>

      <TooltipIconButton
        variant="ghost"
        size="icon-sm"
        className={sidebarChromeIconButtonClass}
        aria-label="Search chats"
        tooltip={shortcutTooltip(
          'Search chats',
          <KbdGroup className="opacity-95" aria-hidden>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        )}
        onClick={openChatSearch}
      >
        <Search className="size-4 shrink-0" />
      </TooltipIconButton>

      <TooltipIconButton
        variant="ghost"
        size="icon-sm"
        className={sidebarChromeIconButtonClass}
        aria-label="New chat"
        tooltip={shortcutTooltip(
          'New chat',
          <KbdGroup className="opacity-95" aria-hidden>
            <Kbd>Ctrl</Kbd>
            <Kbd>N</Kbd>
          </KbdGroup>
        )}
        onClick={onNewChat}
      >
        <NewChat className="size-4 shrink-0" />
      </TooltipIconButton>

      <div className="min-w-0 flex-1" />

      <TooltipIconButton
        variant="ghost"
        size="icon-sm"
        className={sidebarChromeIconButtonClass}
        disabled={!canGoBack}
        tooltip="Previous chat"
        onClick={goBackInChatHistory}
      >
        <ArrowLeft className="size-4 shrink-0" />
      </TooltipIconButton>
      <TooltipIconButton
        variant="ghost"
        size="icon-sm"
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
