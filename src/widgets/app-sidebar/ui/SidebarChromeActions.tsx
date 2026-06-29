import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResizableSidebar } from '@/app/context/resizable-sidebar-context'
import { EMPTY_CHAT_HISTORY, useChatsStore } from '@/entities/chat/model/store'
import { chatRoutePath } from '@/features/chat/lib/chat-route'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'
import { NewChat, PanelLeftClose, PanelLeftOpen, Search, ArrowLeft, ArrowRight } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/utils'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'
import { sidebarChromeIconButtonClass } from '@/widgets/app-sidebar/lib/sidebar-chat-styles'

function shortcutTooltip(label: string, keys: ReactNode) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span>{label}</span>
      {keys}
    </span>
  )
}

const iconButtonClass = cn(sidebarChromeIconButtonClass, 'size-[30px] shrink-0')

/** Hide sidebar panel — shared by chat and settings chrome. */
export function SidebarChromeHideToggle({ className }: { className?: string }) {
  const { sidebarCollapsed, toggleSidebarPanel } = useResizableSidebar()

  return (
    <TooltipIconButton
      variant="ghost"
      size="icon-sm"
      className={cn(iconButtonClass, className)}
      tooltip={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
      aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
      onClick={toggleSidebarPanel}
    >
      {sidebarCollapsed ? (
        <PanelLeftOpen className="size-4 shrink-0" />
      ) : (
        <PanelLeftClose className="size-4 shrink-0" />
      )}
    </TooltipIconButton>
  )
}

/** Hide / search / new chat — shared by sidebar header and collapsed overlay. */
export function SidebarChromePrimaryActions({ className }: { className?: string }) {
  const { openChatSearch } = useResizableSidebar()
  const navigate = useNavigate()
  const createChat = useChatsStore((s) => s.createChat)

  const handleNewChat = useCallback(() => {
    const id = createChat()
    navigate(chatRoutePath(id))
  }, [createChat, navigate])

  return (
    <div className={cn('flex shrink-0 items-center gap-0.5', className)}>
      <SidebarChromeHideToggle />

      <TooltipIconButton
        variant="ghost"
        size="icon-sm"
        className={iconButtonClass}
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
        className={iconButtonClass}
        aria-label="New chat"
        tooltip={shortcutTooltip(
          'New chat',
          <KbdGroup className="opacity-95" aria-hidden>
            <Kbd>Ctrl</Kbd>
            <Kbd>N</Kbd>
          </KbdGroup>
        )}
        onClick={handleNewChat}
      >
        <NewChat className="size-4 shrink-0" />
      </TooltipIconButton>
    </div>
  )
}

/** Hide / search — settings sidebar header and collapsed overlay. */
export function SettingsSidebarChromePrimaryActions({ className }: { className?: string }) {
  const { openSettingsSearch } = useResizableSidebar()

  return (
    <div className={cn('flex shrink-0 items-center gap-0.5', className)}>
      <SidebarChromeHideToggle />
      <TooltipIconButton
        variant="ghost"
        size="icon-sm"
        className={iconButtonClass}
        aria-label="Search settings"
        tooltip={shortcutTooltip(
          'Search settings',
          <KbdGroup className="opacity-95" aria-hidden>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        )}
        onClick={openSettingsSearch}
      >
        <Search className="size-4 shrink-0" />
      </TooltipIconButton>
    </div>
  )
}

/** Back / forward chat history. */
export function SidebarChromeHistoryActions({ className }: { className?: string }) {
  const navigate = useNavigate()
  const chatHistoryPast = useChatsStore((s) => s.chatHistoryPast ?? EMPTY_CHAT_HISTORY)
  const chatHistoryFuture = useChatsStore((s) => s.chatHistoryFuture ?? EMPTY_CHAT_HISTORY)
  const goBackInChatHistory = useChatsStore((s) => s.goBackInChatHistory)
  const goForwardInChatHistory = useChatsStore((s) => s.goForwardInChatHistory)

  const canGoBack = chatHistoryPast.length > 0
  const canGoForward = chatHistoryFuture.length > 0

  const handleBack = useCallback(() => {
    goBackInChatHistory()
    const id = useChatsStore.getState().activeChatId
    if (id) navigate(chatRoutePath(id))
  }, [goBackInChatHistory, navigate])

  const handleForward = useCallback(() => {
    goForwardInChatHistory()
    const id = useChatsStore.getState().activeChatId
    if (id) navigate(chatRoutePath(id))
  }, [goForwardInChatHistory, navigate])

  return (
    <div className={cn('flex shrink-0 items-center gap-0.5', className)}>
      <TooltipIconButton
        variant="ghost"
        size="icon-sm"
        className={iconButtonClass}
        disabled={!canGoBack}
        tooltip="Previous chat"
        onClick={handleBack}
      >
        <ArrowLeft className="size-4 shrink-0" />
      </TooltipIconButton>
      <TooltipIconButton
        variant="ghost"
        size="icon-sm"
        className={iconButtonClass}
        disabled={!canGoForward}
        tooltip="Next chat"
        onClick={handleForward}
      >
        <ArrowRight className="size-4 shrink-0" />
      </TooltipIconButton>
    </div>
  )
}
