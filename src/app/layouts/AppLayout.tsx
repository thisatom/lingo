import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useChatsStore } from '@/entities/chat/model/store'
import { useSidebarPanel } from '@/app/layouts/hooks/use-sidebar-panel'
import { sidebarWidthCss, sidebarPanelConstraintCss } from '@/app/layouts/lib/sidebar-layout-storage'
import { ResizableSidebarContext } from '@/app/context/resizable-sidebar-context'
import { AppStartupOverlay } from '@/app/ui/AppStartupOverlay'
import { AppSidebar } from '@/widgets/app-sidebar/ui/AppSidebar'
import { useAppearanceSync } from '@/app/hooks/use-appearance-sync'
import { useThemeSync } from '@/app/hooks/use-theme-sync'
import { useWindowTitle } from '@/app/hooks/use-window-title'
import { useNewChatHotkey } from '@/features/chat/model/useNewChatHotkey'
import { useChatSearchHotkey } from '@/features/chat-search/model/useChatSearchHotkey'
import { ChatSearchDialog } from '@/features/chat-search/ui/ChatSearchDialog'
import { useSettingsSearchHotkey } from '@/features/settings-search/model/useSettingsSearchHotkey'
import { SettingsSearchDialog } from '@/features/settings-search/ui/SettingsSearchDialog'
import { useAppReady } from '@/shared/lib/hooks/use-app-ready'
import { useIsMobile } from '@/shared/lib/hooks/use-mobile'
import { SIDEBAR_PANEL_MAX_WIDTH_PX } from '@/shared/lib/layout'
import { ChatSidebarChromeButtons } from '@/widgets/chat-header/ui/ChatSidebarChromeButtons'
import { SettingsSidebarChromeButtons } from '@/widgets/chat-header/ui/SettingsSidebarChromeButtons'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ui/resizable'
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar'
import { TooltipProvider, TOOLTIP_SHOW_DELAY_MS, TOOLTIP_SKIP_DELAY_MS } from '@/shared/ui/tooltip'

export function AppLayout() {
  useThemeSync()
  useAppearanceSync()
  useWindowTitle()
  useNewChatHotkey()
  const appReady = useAppReady()
  const location = useLocation()
  const isSettingsRoute = location.pathname.startsWith('/settings')
  const sidebarHideEnabled = true
  const reconcileActiveChat = useChatsStore((s) => s.reconcileActiveChat)
  const [chatSearchOpen, setChatSearchOpen] = useState(false)
  const [settingsSearchOpen, setSettingsSearchOpen] = useState(false)
  const isMobile = useIsMobile()

  const {
    sidebarPanelRef,
    sidebarCollapsed,
    sidebarWidthPx,
    sidebarPanelMinSizePx,
    sidebarWidthResetting,
    initialSidebarWidthPx,
    toggleSidebarPanel,
    handleLayoutChanged,
    handleSeparatorDoubleClick,
    handleSidebarPanelResize
  } = useSidebarPanel({ appReady, isMobile, sidebarHideEnabled })

  const openChatSearch = useCallback(() => setChatSearchOpen(true), [])
  const openSettingsSearch = useCallback(() => setSettingsSearchOpen(true), [])
  useChatSearchHotkey(openChatSearch, !isSettingsRoute)
  useSettingsSearchHotkey(openSettingsSearch, isSettingsRoute)

  useEffect(() => {
    if (useChatsStore.persist.hasHydrated()) {
      reconcileActiveChat()
      return
    }
    return useChatsStore.persist.onFinishHydration(() => {
      reconcileActiveChat()
    })
  }, [reconcileActiveChat])

  const showSidebarHandle =
    !isMobile && (!sidebarHideEnabled || !sidebarCollapsed)

  const sidebarContextValue = useMemo(
    () => ({
      sidebarCollapsed,
      sidebarWidthPx,
      sidebarHideEnabled,
      toggleSidebarPanel,
      openChatSearch,
      openSettingsSearch
    }),
    [
      sidebarCollapsed,
      sidebarWidthPx,
      sidebarHideEnabled,
      toggleSidebarPanel,
      openChatSearch,
      openSettingsSearch
    ]
  )

  return (
    <TooltipProvider delayDuration={TOOLTIP_SHOW_DELAY_MS} skipDelayDuration={TOOLTIP_SKIP_DELAY_MS}>
      <SidebarProvider
        open
        className="!min-h-0 h-full min-h-0 w-full overflow-hidden bg-transparent"
      >
        <ResizableSidebarContext.Provider value={sidebarContextValue}>
          <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
            {!appReady && <AppStartupOverlay />}
            {appReady && !isMobile ? (
              isSettingsRoute ? <SettingsSidebarChromeButtons /> : <ChatSidebarChromeButtons />
            ) : null}
            <ResizablePanelGroup
              id="lingo-main-layout"
              orientation="horizontal"
              disabled={sidebarHideEnabled && sidebarCollapsed}
              className="h-full min-h-0 flex-1 overflow-hidden"
              data-sidebar-collapsed={sidebarCollapsed ? 'true' : undefined}
              data-sidebar-width-reset={sidebarWidthResetting ? 'true' : undefined}
              onLayoutChanged={handleLayoutChanged}
            >
              <ResizablePanel
                id="sidebar"
                panelRef={sidebarPanelRef}
                defaultSize={sidebarWidthCss(initialSidebarWidthPx)}
                minSize={sidebarPanelConstraintCss(sidebarPanelMinSizePx)}
                maxSize={isMobile ? '85%' : sidebarWidthCss(SIDEBAR_PANEL_MAX_WIDTH_PX)}
                groupResizeBehavior="preserve-pixel-size"
                onResize={handleSidebarPanelResize}
                className="overflow-hidden bg-sidebar [contain:layout] data-[sidebar-collapsed=true]:min-w-0 data-[sidebar-collapsed=true]:max-w-0 data-[sidebar-collapsed=true]:border-0"
                data-sidebar-collapsed={sidebarCollapsed ? 'true' : undefined}
              >
                <AppSidebar />
              </ResizablePanel>
              {showSidebarHandle ? (
                <ResizableHandle onDoubleClickReset={handleSeparatorDoubleClick} />
              ) : null}
              <ResizablePanel id="main" minSize="35%" className="overflow-hidden">
                <SidebarInset className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
                  {appReady ? <Outlet /> : null}
                </SidebarInset>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
          <ChatSearchDialog open={chatSearchOpen} onOpenChange={setChatSearchOpen} />
          <SettingsSearchDialog open={settingsSearchOpen} onOpenChange={setSettingsSearchOpen} />
        </ResizableSidebarContext.Provider>
      </SidebarProvider>
    </TooltipProvider>
  )
}
