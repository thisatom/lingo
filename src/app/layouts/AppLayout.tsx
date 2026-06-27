import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useDefaultLayout, usePanelRef } from 'react-resizable-panels'
import { useChatsStore } from '@/entities/chat/model/store'
import { ResizableSidebarContext } from '@/app/context/resizable-sidebar-context'
import { AppStartupOverlay } from '@/app/ui/AppStartupOverlay'
import { AppSidebar } from '@/widgets/app-sidebar/ui/AppSidebar'
import { useAppearanceSync } from '@/app/hooks/use-appearance-sync'
import { useThemeSync } from '@/app/hooks/use-theme-sync'
import { useWindowTitle } from '@/app/hooks/use-window-title'
import { useNewChatHotkey } from '@/features/chat/model/useNewChatHotkey'
import { useChatSearchHotkey } from '@/features/chat-search/model/useChatSearchHotkey'
import { ChatSearchDialog } from '@/features/chat-search/ui/ChatSearchDialog'
import { useAppReady } from '@/shared/lib/hooks/use-app-ready'
import { useIsMobile } from '@/shared/lib/hooks/use-mobile'
import {
  SIDEBAR_PANEL_COLLAPSE_THRESHOLD_PERCENT,
  SIDEBAR_PANEL_MIN_SIZE
} from '@/shared/lib/layout'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ui/resizable'
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar'
import { TooltipProvider, TOOLTIP_SHOW_DELAY_MS, TOOLTIP_SKIP_DELAY_MS } from '@/shared/ui/tooltip'
import { shouldCollapseSidebarOnResize } from '@/app/layouts/lib/sidebar-panel-resize'

const LAYOUT_PANEL_IDS = ['sidebar', 'main'] as const

export function AppLayout() {
  useThemeSync()
  useAppearanceSync()
  useWindowTitle()
  useNewChatHotkey()
  const appReady = useAppReady()
  const reconcileActiveChat = useChatsStore((s) => s.reconcileActiveChat)
  const sidebarPanelRef = usePanelRef()
  const prevSidebarSizeRef = useRef<number | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const isMobile = useIsMobile()

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: 'lingo-main-layout',
    panelIds: [...LAYOUT_PANEL_IDS]
  })

  const openChatSearch = useCallback(() => setSearchOpen(true), [])
  useChatSearchHotkey(openChatSearch)

  useEffect(() => {
    if (!isMobile) return
    const panel = sidebarPanelRef.current
    if (!panel || panel.isCollapsed()) return
    panel.collapse()
    setSidebarCollapsed(true)
  }, [isMobile, sidebarPanelRef])

  useEffect(() => {
    if (useChatsStore.persist.hasHydrated()) {
      reconcileActiveChat()
      return
    }
    return useChatsStore.persist.onFinishHydration(() => {
      reconcileActiveChat()
    })
  }, [reconcileActiveChat])

  const syncSidebarCollapsed = useCallback(() => {
    const panel = sidebarPanelRef.current
    setSidebarCollapsed(panel?.isCollapsed() ?? false)
  }, [sidebarPanelRef])

  const toggleSidebarPanel = useCallback(() => {
    const panel = sidebarPanelRef.current
    if (!panel) return
    if (panel.isCollapsed()) {
      prevSidebarSizeRef.current = 0
      panel.expand()
    } else {
      prevSidebarSizeRef.current = panel.getSize().asPercentage
      panel.collapse()
    }
    syncSidebarCollapsed()
  }, [sidebarPanelRef, syncSidebarCollapsed])

  const handleSidebarResize = useCallback(
    (panelSize: { asPercentage: number }) => {
      const panel = sidebarPanelRef.current
      const previousSize = prevSidebarSizeRef.current
      prevSidebarSizeRef.current = panelSize.asPercentage

      if (
        panel &&
        !panel.isCollapsed() &&
        shouldCollapseSidebarOnResize(
          panelSize.asPercentage,
          previousSize,
          SIDEBAR_PANEL_COLLAPSE_THRESHOLD_PERCENT
        )
      ) {
        panel.collapse()
      }
      syncSidebarCollapsed()
    },
    [sidebarPanelRef, syncSidebarCollapsed]
  )

  return (
    <TooltipProvider delayDuration={TOOLTIP_SHOW_DELAY_MS} skipDelayDuration={TOOLTIP_SKIP_DELAY_MS}>
      <SidebarProvider
        open
        className="!min-h-0 h-full min-h-0 w-full overflow-hidden bg-transparent"
      >
        <ResizableSidebarContext.Provider
          value={{ sidebarCollapsed, toggleSidebarPanel, openChatSearch }}
        >
          <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
            {!appReady && <AppStartupOverlay />}
            <ResizablePanelGroup
              id="lingo-main-layout"
              orientation="horizontal"
              className="h-full min-h-0 flex-1 overflow-hidden"
              defaultLayout={defaultLayout}
              onLayoutChanged={onLayoutChanged}
            >
              <ResizablePanel
                id="sidebar"
                panelRef={sidebarPanelRef}
                collapsible
                collapsedSize="0%"
                defaultSize="22%"
                minSize={isMobile ? '0%' : SIDEBAR_PANEL_MIN_SIZE}
                maxSize={isMobile ? '85%' : '40%'}
                className="overflow-hidden bg-sidebar"
                onResize={handleSidebarResize}
              >
                <AppSidebar />
              </ResizablePanel>
              <ResizableHandle disabled={sidebarCollapsed} />
              <ResizablePanel
                id="main"
                defaultSize="78%"
                minSize="35%"
                className="overflow-hidden"
              >
                <SidebarInset className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
                  {appReady ? <Outlet /> : null}
                </SidebarInset>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
          <ChatSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
        </ResizableSidebarContext.Provider>
      </SidebarProvider>
    </TooltipProvider>
  )
}
