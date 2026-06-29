import type { PanelImperativeHandle } from 'react-resizable-panels'
import {
  readSidebarWidthPx,
  sidebarWidthCss,
  writeSidebarWidthPx
} from '@/app/layouts/lib/sidebar-layout-storage'
import { SIDEBAR_PANEL_HIDDEN_THRESHOLD_PX } from '@/shared/lib/layout'

export function isSidebarPanelHidden(sizePx: number): boolean {
  return sizePx <= SIDEBAR_PANEL_HIDDEN_THRESHOLD_PX
}

export function readSidebarPanelHidden(panel: PanelImperativeHandle | null): boolean {
  if (!panel) return false
  return isSidebarPanelHidden(panel.getSize().inPixels)
}

/** Save width and hide — caller must set panel minSize to 0 before resize. */
export function persistSidebarWidthBeforeHide(panel: PanelImperativeHandle): void {
  const px = panel.getSize().inPixels
  if (!isSidebarPanelHidden(px)) {
    writeSidebarWidthPx(px)
  }
}

export function resizeSidebarPanelHidden(panel: PanelImperativeHandle): void {
  panel.resize('0px')
}

export function resizeSidebarPanelVisible(panel: PanelImperativeHandle): void {
  panel.resize(sidebarWidthCss(readSidebarWidthPx()))
}

export function restoreSidebarPanelWidth(panel: PanelImperativeHandle): void {
  if (readSidebarPanelHidden(panel)) return
  panel.resize(sidebarWidthCss(readSidebarWidthPx()))
}
