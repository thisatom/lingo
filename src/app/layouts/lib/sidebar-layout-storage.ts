import {
  SIDEBAR_PANEL_DEFAULT_WIDTH_PX,
  SIDEBAR_PANEL_MAX_WIDTH_PX,
  SIDEBAR_PANEL_MIN_SIZE_PX
} from '@/shared/lib/layout'

const SIDEBAR_WIDTH_PX_KEY = 'lingo-sidebar-width-px'
const SIDEBAR_COLLAPSED_KEY = 'lingo-sidebar-collapsed'
/** Legacy percentage layout from `useDefaultLayout` — clear on hydrate. */
const LEGACY_LAYOUT_KEY = 'react-resizable-panels:layout:lingo-main-layout'

export function clampSidebarWidthPx(value: number): number {
  if (!Number.isFinite(value)) return SIDEBAR_PANEL_DEFAULT_WIDTH_PX
  return Math.min(
    SIDEBAR_PANEL_MAX_WIDTH_PX,
    Math.max(SIDEBAR_PANEL_MIN_SIZE_PX, Math.round(value))
  )
}

export function readSidebarWidthPx(): number {
  try {
    const raw = localStorage.getItem(SIDEBAR_WIDTH_PX_KEY)
    if (raw == null) return SIDEBAR_PANEL_DEFAULT_WIDTH_PX
    return clampSidebarWidthPx(Number(raw))
  } catch {
    return SIDEBAR_PANEL_DEFAULT_WIDTH_PX
  }
}

export function writeSidebarWidthPx(widthPx: number): void {
  try {
    localStorage.setItem(SIDEBAR_WIDTH_PX_KEY, String(clampSidebarWidthPx(widthPx)))
  } catch {
    // ignore quota / private mode
  }
}

export function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
  } catch {
    // ignore
  }
}

export function clearLegacySidebarLayoutStorage(): void {
  try {
    localStorage.removeItem(LEGACY_LAYOUT_KEY)
  } catch {
    // ignore
  }
}

export function sidebarWidthCss(px: number): string {
  return `${clampSidebarWidthPx(px)}px`
}

/** Panel min/max constraints — allows 0 for hidden sidebar (not clamped to expanded min). */
export function sidebarPanelConstraintCss(px: number): string {
  if (px <= 0) return '0px'
  return sidebarWidthCss(px)
}
