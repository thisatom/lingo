import { CHAT_SCROLL_BOTTOM_THRESHOLD_PX } from '@/shared/lib/chat-scroll-threshold'

export function getViewportMaxScrollTop(viewport: HTMLElement): number {
  return Math.max(0, viewport.scrollHeight - viewport.clientHeight)
}

export function distanceFromViewportBottom(
  viewport: HTMLElement,
  threshold = CHAT_SCROLL_BOTTOM_THRESHOLD_PX
): number {
  return Math.max(0, getViewportMaxScrollTop(viewport) - viewport.scrollTop)
}

export function isViewportAtBottom(
  viewport: HTMLElement,
  threshold = CHAT_SCROLL_BOTTOM_THRESHOLD_PX
): boolean {
  return distanceFromViewportBottom(viewport) <= threshold
}
