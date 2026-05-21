const ANCHOR_TOP_OFFSET_PX = 18

function getScrollContentRoot(viewport: HTMLElement): HTMLElement {
  return (
    viewport.querySelector<HTMLElement>('[data-chat-scroll-content]') ??
    (viewport.firstElementChild as HTMLElement | null) ??
    viewport
  )
}

/** Document offset of a turn within the scroll content (stable with sticky headers). */
export function getTurnOffsetTop(viewport: HTMLElement, turnEl: HTMLElement): number {
  const root = getScrollContentRoot(viewport)
  let top = 0
  let node: HTMLElement | null = turnEl

  while (node && node !== root) {
    top += node.offsetTop
    const parent = node.offsetParent as HTMLElement | null
    if (!parent || parent === node) break
    node = parent
    if (!root.contains(node)) break
  }

  return top
}

export function findScrollAnchorAtScrollTop(
  viewport: HTMLElement,
  scrollTop: number
): string | null {
  const anchorScrollTop = scrollTop + ANCHOR_TOP_OFFSET_PX
  let anchorId: string | null = null
  let bestTop = -Infinity

  for (const el of viewport.querySelectorAll<HTMLElement>('[data-turn-id]')) {
    const turnTop = getTurnOffsetTop(viewport, el)
    if (turnTop <= anchorScrollTop + 4 && turnTop > bestTop) {
      bestTop = turnTop
      anchorId = el.dataset.turnId ?? null
    }
  }

  return anchorId
}

export function findScrollAnchorUserMessageId(viewport: HTMLElement): string | null {
  return findScrollAnchorAtScrollTop(viewport, viewport.scrollTop)
}

export function scrollToTurnAnchor(
  viewport: HTMLElement,
  userMessageId: string,
  behavior: ScrollBehavior = 'instant'
): boolean {
  const el = viewport.querySelector<HTMLElement>(
    `[data-turn-id="${CSS.escape(userMessageId)}"]`
  )
  if (!el) return false

  const turnTop = getTurnOffsetTop(viewport, el)

  viewport.scrollTo({
    top: Math.max(0, turnTop - ANCHOR_TOP_OFFSET_PX),
    behavior
  })

  return true
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

export function restoreChatScrollPosition(
  viewport: HTMLElement,
  scrollTop: number | null | undefined,
  userMessageId: string | null | undefined
): boolean {
  if (scrollTop != null && scrollTop > 0) {
    const { contentReady } = applyScrollTop(viewport, scrollTop)
    return contentReady
  }

  if (userMessageId) {
    scrollToTurnAnchor(viewport, userMessageId, 'instant')
    return true
  }

  return false
}
