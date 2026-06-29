import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { usePanelRef } from 'react-resizable-panels'
import {
  clearLegacySidebarLayoutStorage,
  readSidebarCollapsed,
  readSidebarWidthPx,
  sidebarWidthCss,
  writeSidebarCollapsed,
  writeSidebarWidthPx
} from '@/app/layouts/lib/sidebar-layout-storage'
import {
  persistSidebarWidthBeforeHide,
  readSidebarPanelHidden,
  resizeSidebarPanelHidden,
  resizeSidebarPanelVisible,
  restoreSidebarPanelWidth
} from '@/app/layouts/lib/sidebar-panel-state'
import { SIDEBAR_PANEL_DEFAULT_WIDTH_PX, SIDEBAR_PANEL_MIN_SIZE_PX } from '@/shared/lib/layout'
import { dismissAllTooltips } from '@/shared/ui/tooltip-dismiss'

const SIDEBAR_WIDTH_RESET_MS = 220
const SIDEBAR_LAYOUT_PERSIST_MS = 120

interface UseSidebarPanelOptions {
  appReady: boolean
  isMobile: boolean
  sidebarHideEnabled: boolean
}

function readInitialPanelMinSizePx(sidebarHideEnabled: boolean, isMobile: boolean): number {
  if (isMobile) return 0
  if (sidebarHideEnabled && readSidebarCollapsed()) return 0
  return SIDEBAR_PANEL_MIN_SIZE_PX
}

export function useSidebarPanel({
  appReady,
  isMobile,
  sidebarHideEnabled
}: UseSidebarPanelOptions) {
  const sidebarPanelRef = usePanelRef()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    sidebarHideEnabled ? readSidebarCollapsed() : false
  )
  const [sidebarWidthPx, setSidebarWidthPx] = useState(() => readSidebarWidthPx())
  const [initialSidebarWidthPx] = useState(() => readSidebarWidthPx())
  const [sidebarPanelMinSizePx, setSidebarPanelMinSizePx] = useState(() =>
    readInitialPanelMinSizePx(sidebarHideEnabled, isMobile)
  )
  const [sidebarWidthResetting, setSidebarWidthResetting] = useState(false)
  const layoutSyncRef = useRef(false)
  const widthResetTimerRef = useRef<number | null>(null)
  const layoutPersistTimerRef = useRef<number | null>(null)

  const syncSidebarState = useCallback(() => {
    const panel = sidebarPanelRef.current
    if (!panel) return

    const px = panel.getSize().inPixels
    setSidebarWidthPx(px)

    // User intent (localStorage) is source of truth on chat routes — not transient panel width.
    const hidden = sidebarHideEnabled
      ? readSidebarCollapsed()
      : readSidebarPanelHidden(panel)

    setSidebarCollapsed(hidden)

    if (!hidden && sidebarHideEnabled) {
      writeSidebarWidthPx(px)
    }

    if (hidden && sidebarHideEnabled) {
      writeSidebarCollapsed(true)
    }
  }, [sidebarHideEnabled, sidebarPanelRef])

  const beginWidthReset = useCallback(() => {
    setSidebarWidthResetting(true)
    if (widthResetTimerRef.current != null) {
      window.clearTimeout(widthResetTimerRef.current)
    }
    widthResetTimerRef.current = window.setTimeout(() => {
      setSidebarWidthResetting(false)
      widthResetTimerRef.current = null
    }, SIDEBAR_WIDTH_RESET_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (widthResetTimerRef.current != null) {
        window.clearTimeout(widthResetTimerRef.current)
      }
      if (layoutPersistTimerRef.current != null) {
        window.clearTimeout(layoutPersistTimerRef.current)
      }
    }
  }, [])

  const persistExpandedSidebarWidth = useCallback(() => {
    const panel = sidebarPanelRef.current
    if (!panel || layoutSyncRef.current) return

    const px = panel.getSize().inPixels
    setSidebarWidthPx(px)

    if (sidebarHideEnabled && !readSidebarCollapsed()) {
      writeSidebarWidthPx(px)
    }
  }, [sidebarHideEnabled, sidebarPanelRef])

  const schedulePersistExpandedSidebarWidth = useCallback(() => {
    if (layoutPersistTimerRef.current != null) {
      window.clearTimeout(layoutPersistTimerRef.current)
    }
    layoutPersistTimerRef.current = window.setTimeout(() => {
      layoutPersistTimerRef.current = null
      persistExpandedSidebarWidth()
    }, SIDEBAR_LAYOUT_PERSIST_MS)
  }, [persistExpandedSidebarWidth])

  const hideSidebar = useCallback(
    (panel: NonNullable<typeof sidebarPanelRef.current>) => {
      persistSidebarWidthBeforeHide(panel)
      writeSidebarCollapsed(true)
      flushSync(() => {
        setSidebarCollapsed(true)
        setSidebarPanelMinSizePx(0)
        setSidebarWidthPx(0)
      })
      if (!readSidebarPanelHidden(panel)) {
        resizeSidebarPanelHidden(panel)
      }
      syncSidebarState()
    },
    [syncSidebarState]
  )

  const showSidebar = useCallback(
    (panel: NonNullable<typeof sidebarPanelRef.current>) => {
      writeSidebarCollapsed(false)
      flushSync(() => {
        setSidebarCollapsed(false)
        setSidebarPanelMinSizePx(SIDEBAR_PANEL_MIN_SIZE_PX)
      })
      resizeSidebarPanelVisible(panel)
      syncSidebarState()
    },
    [syncSidebarState]
  )

  const applySidebarLayout = useCallback(() => {
    const panel = sidebarPanelRef.current
    if (!panel || !appReady) return

    layoutSyncRef.current = true

    if (isMobile) {
      setSidebarPanelMinSizePx(0)
      if (!readSidebarPanelHidden(panel)) {
        requestAnimationFrame(() => {
          resizeSidebarPanelHidden(panel)
          setSidebarCollapsed(true)
          layoutSyncRef.current = false
        })
      } else {
        setSidebarCollapsed(true)
        layoutSyncRef.current = false
      }
      return
    }

    if (!sidebarHideEnabled) {
      setSidebarPanelMinSizePx(SIDEBAR_PANEL_MIN_SIZE_PX)
      if (readSidebarPanelHidden(panel)) {
        requestAnimationFrame(() => {
          resizeSidebarPanelVisible(panel)
          syncSidebarState()
          layoutSyncRef.current = false
        })
      } else {
        restoreSidebarPanelWidth(panel)
        requestAnimationFrame(() => {
          syncSidebarState()
          layoutSyncRef.current = false
        })
      }
      return
    }

    if (readSidebarCollapsed()) {
      setSidebarPanelMinSizePx(0)
      if (!readSidebarPanelHidden(panel)) {
        requestAnimationFrame(() => {
          resizeSidebarPanelHidden(panel)
          syncSidebarState()
          layoutSyncRef.current = false
        })
      } else {
        syncSidebarState()
        layoutSyncRef.current = false
      }
      return
    }

    setSidebarPanelMinSizePx(SIDEBAR_PANEL_MIN_SIZE_PX)
    if (readSidebarPanelHidden(panel)) {
      requestAnimationFrame(() => {
        showSidebar(panel)
        layoutSyncRef.current = false
      })
    } else {
      restoreSidebarPanelWidth(panel)
      requestAnimationFrame(() => {
        syncSidebarState()
        layoutSyncRef.current = false
      })
    }
  }, [
    appReady,
    hideSidebar,
    isMobile,
    showSidebar,
    sidebarHideEnabled,
    sidebarPanelRef,
    syncSidebarState
  ])

  useEffect(() => {
    clearLegacySidebarLayoutStorage()
  }, [])

  useEffect(() => {
    if (!appReady) return
    let raf = 0
    const run = () => {
      if (!sidebarPanelRef.current) {
        raf = requestAnimationFrame(run)
        return
      }
      applySidebarLayout()
    }
    run()
    return () => cancelAnimationFrame(raf)
  }, [appReady, applySidebarLayout, sidebarPanelRef])

  useEffect(() => {
    dismissAllTooltips()
  }, [sidebarCollapsed])

  const toggleSidebarPanel = useCallback(() => {
    if (!sidebarHideEnabled) return
    const panel = sidebarPanelRef.current
    if (!panel) return

    if (readSidebarCollapsed()) {
      showSidebar(panel)
    } else {
      hideSidebar(panel)
    }

    dismissAllTooltips()
  }, [hideSidebar, showSidebar, sidebarHideEnabled, sidebarPanelRef])

  const handleSidebarPanelResize = useCallback(
    (panelSize: { inPixels: number }) => {
      if (layoutSyncRef.current) return
      const panel = sidebarPanelRef.current
      if (!panel || readSidebarPanelHidden(panel)) return
      if (panelSize.inPixels < SIDEBAR_PANEL_MIN_SIZE_PX) {
        panel.resize(sidebarWidthCss(SIDEBAR_PANEL_MIN_SIZE_PX))
      }
    },
    [sidebarPanelRef]
  )

  const handleLayoutChanged = useCallback(() => {
    const panel = sidebarPanelRef.current
    if (!panel || layoutSyncRef.current) {
      return
    }

    if (
      sidebarHideEnabled &&
      !isMobile &&
      !readSidebarCollapsed() &&
      sidebarPanelMinSizePx >= SIDEBAR_PANEL_MIN_SIZE_PX &&
      readSidebarPanelHidden(panel)
    ) {
      setSidebarPanelMinSizePx(SIDEBAR_PANEL_MIN_SIZE_PX)
      requestAnimationFrame(() => {
        restoreSidebarPanelWidth(panel)
        syncSidebarState()
      })
      return
    }

    schedulePersistExpandedSidebarWidth()
  }, [
    isMobile,
    schedulePersistExpandedSidebarWidth,
    sidebarHideEnabled,
    sidebarPanelMinSizePx,
    syncSidebarState
  ])

  const handleSeparatorDoubleClick = useCallback(() => {
    const panel = sidebarPanelRef.current
    if (!panel) return

    if (sidebarHideEnabled && readSidebarCollapsed()) {
      showSidebar(panel)
      return
    }

    beginWidthReset()
    setSidebarPanelMinSizePx(SIDEBAR_PANEL_MIN_SIZE_PX)
    writeSidebarWidthPx(SIDEBAR_PANEL_DEFAULT_WIDTH_PX)
    setSidebarWidthPx(SIDEBAR_PANEL_DEFAULT_WIDTH_PX)
    panel.resize(sidebarWidthCss(SIDEBAR_PANEL_DEFAULT_WIDTH_PX))
    syncSidebarState()
  }, [beginWidthReset, showSidebar, sidebarHideEnabled, sidebarPanelRef, syncSidebarState])

  return {
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
  }
}
