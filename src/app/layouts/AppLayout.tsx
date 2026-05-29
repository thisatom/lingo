import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { usePanelRef } from 'react-resizable-panels'
import { useChatsStore } from '@/entities/chat/model/store'
import { ResizableSidebarContext } from '@/app/context/resizable-sidebar-context'
import { AppStartupOverlay } from '@/app/ui/AppStartupOverlay'
import { AppSidebar } from '@/widgets/app-sidebar/ui/AppSidebar'
import { useAppearanceSync } from '@/app/hooks/use-appearance-sync'
import { useThemeSync } from '@/app/hooks/use-theme-sync'
import { useWindowTitle } from '@/app/hooks/use-window-title'
import { useNewChatHotkey } from '@/features/chat/model/useNewChatHotkey'
import { useAppReady } from '@/shared/lib/hooks/use-app-ready'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ui/resizable'
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar'
import { TooltipProvider } from '@/shared/ui/tooltip'

export function AppLayout() {
  useThemeSync()
  useAppearanceSync()
  useWindowTitle()
  useNewChatHotkey()
  const appReady = useAppReady()
  const reconcileActiveChat = useChatsStore((s) => s.reconcileActiveChat)
  const sidebarPanelRef = usePanelRef()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (useChatsStore.persist.hasHydrated()) {
      reconcileActiveChat()
      return
    }
    return useChatsStore.persist.onFinishHydration(() => {
      reconcileActiveChat()
    })
  }, [reconcileActiveChat])

  const toggleSidebarPanel = useCallback(() => {
    const panel = sidebarPanelRef.current
    if (!panel) return
    if (panel.isCollapsed()) {
      panel.expand()
      setSidebarCollapsed(false)
    } else {
      panel.collapse()
      setSidebarCollapsed(true)
    }
  }, [sidebarPanelRef])

  const handleSidebarResize = useCallback(
    (size: { asPercentage: number }) => {
      const collapsed = size.asPercentage < 1
      setSidebarCollapsed(collapsed)
      if (sidebarPanelRef.current) {
        setSidebarCollapsed(sidebarPanelRef.current.isCollapsed())
      }
    },
    [sidebarPanelRef]
  )

  return (
    <TooltipProvider delayDuration={240} skipDelayDuration={180}>
      <SidebarProvider
        open
        className="!min-h-0 h-full min-h-0 w-full overflow-hidden bg-transparent"
      >
        <ResizableSidebarContext.Provider value={{ sidebarCollapsed, toggleSidebarPanel }}>
          <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
            {!appReady && <AppStartupOverlay />}
            <ResizablePanelGroup
              orientation="horizontal"
              className="h-full min-h-0 flex-1 overflow-hidden"
            >
              <ResizablePanel
                id="sidebar"
                panelRef={sidebarPanelRef}
                collapsible
                collapsedSize="0%"
                defaultSize="22%"
                minSize="14rem"
                maxSize="40%"
                className="min-h-0 min-w-0 overflow-hidden"
                onResize={handleSidebarResize}
              >
                <AppSidebar />
              </ResizablePanel>
              <ResizableHandle className="z-20" />
              <ResizablePanel
                id="main"
                defaultSize="78%"
                minSize="50%"
                className="min-h-0 min-w-0 overflow-hidden"
              >
                <SidebarInset className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
                  {appReady ? <Outlet /> : null}
                </SidebarInset>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ResizableSidebarContext.Provider>
      </SidebarProvider>
    </TooltipProvider>
  )
}
