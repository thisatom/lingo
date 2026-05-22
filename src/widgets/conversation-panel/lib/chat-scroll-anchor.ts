export function getMaxScrollTop(viewport: HTMLElement): number {
  return Math.max(0, viewport.scrollHeight - viewport.clientHeight)
}

/** Scroll to the true bottom (not `scrollHeight`, which overshoots and clamps). */
export function scrollViewportToBottom(
  viewport: HTMLElement,
  behavior: ScrollBehavior = 'instant'
): void {
  viewport.scrollTo({ top: getMaxScrollTop(viewport), behavior })
}

export function applyScrollTop(
  viewport: HTMLElement,
  scrollTop: number
): { applied: number; contentReady: boolean } {
  const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight)
  if (maxScroll <= 0 && scrollTop > 4) {
    return { applied: 0, contentReady: false }
  }

  const target = Math.min(Math.max(0, scrollTop), maxScroll)
  viewport.scrollTop = target

  const contentReady = maxScroll >= scrollTop - 8 || scrollTop <= 8
  return { applied: target, contentReady }
}
