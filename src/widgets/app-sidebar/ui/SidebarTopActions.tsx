import { ChevronLeft, ChevronRight, PanelLeft, Search } from 'lucide-react'
import { useResizableSidebar } from '@/app/context/resizable-sidebar-context'
import { useChatsStore } from '@/entities/chat/model/store'
import { Button } from '@/shared/ui/button'

interface SidebarTopActionsProps {
  onOpenSearch: () => void
}

export function SidebarTopActions({ onOpenSearch }: SidebarTopActionsProps) {
  const { toggleSidebarPanel, sidebarCollapsed } = useResizableSidebar()
  const chatHistoryPast = useChatsStore((s) => s.chatHistoryPast ?? [])
  const chatHistoryFuture = useChatsStore((s) => s.chatHistoryFuture ?? [])
  const goBackInChatHistory = useChatsStore((s) => s.goBackInChatHistory)
  const goForwardInChatHistory = useChatsStore((s) => s.goForwardInChatHistory)

  const canGoBack = chatHistoryPast.length > 0
  const canGoForward = chatHistoryFuture.length > 0

  if (sidebarCollapsed) return null

  return (
    <div className="flex items-center gap-0.5 px-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        title="Hide sidebar"
        aria-label="Hide sidebar"
        onClick={toggleSidebarPanel}
      >
        <PanelLeft className="size-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        title="Search chats (Ctrl+K)"
        aria-label="Search chats"
        onClick={onOpenSearch}
      >
        <Search className="size-4" />
      </Button>

      <div className="min-w-0 flex-1" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        disabled={!canGoBack}
        title="Previous chat"
        aria-label="Previous chat"
        onClick={goBackInChatHistory}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        disabled={!canGoForward}
        title="Next chat"
        aria-label="Next chat"
        onClick={goForwardInChatHistory}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
