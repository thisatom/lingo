import { CHAT_TITLE_COLLAPSED_START_PX } from '@/shared/lib/layout'

/** Resizable handle between sidebar and main column. */
const SIDEBAR_MAIN_SEPARATOR_PX = 1

/**
 * Extra margin-left for the chat title row so it never overlaps fixed chrome
 * while the sidebar panel width animates.
 */
export function chatTitleMarginLeftPx(
  sidebarWidthPx: number,
  headerPaddingPx: number
): number {
  const mainContentLeftPx = sidebarWidthPx + SIDEBAR_MAIN_SEPARATOR_PX
  return Math.max(0, CHAT_TITLE_COLLAPSED_START_PX - headerPaddingPx - mainContentLeftPx)
}
