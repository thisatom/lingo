import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResizableSidebar } from '@/app/context/resizable-sidebar-context'
import { useChatsStore } from '@/entities/chat/model/store'
import { chatRoutePath } from '@/features/chat/lib/chat-route'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'
import { NewChat, PanelLeftOpen, Search } from '@/shared/ui/icons'
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

export function SidebarCollapsedToolbar({ className }: { className?: string }) {
  const { sidebarCollapsed, toggleSidebarPanel, openChatSearch } = useResizableSidebar()
  const navigate = useNavigate()
  const createChat = useChatsStore((s) => s.createChat)

  const handleNewChat = useCallback(() => {
    const id = createChat()
    navigate(chatRoutePath(id))
  }, [createChat, navigate])

  if (!sidebarCollapsed) return null

  return (
    <div className={cn('flex shrink-0 items-center gap-0.5', className)}>
      <TooltipIconButton
        variant="ghost"
        size="icon-sm"
        className={sidebarChromeIconButtonClass}
        tooltip="Show sidebar"
        aria-label="Show sidebar"
        onClick={toggleSidebarPanel}
      >
        <PanelLeftOpen className="size-4 shrink-0" />
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
        onClick={handleNewChat}
      >
        <NewChat className="size-4 shrink-0" />
      </TooltipIconButton>
    </div>
  )
}
