export function getMaxScrollTop(viewport: HTMLElement): number {
  return Math.max(0, viewport.scrollHeight - viewport.clientHeight)
}

export type VirtualizationScrollAnchor = {
  scrollTop: number
  turnId: string | null
}

/** Capture viewport position before flat ↔ virtualized remount. */
export function captureVirtualizationScrollAnchor(
  viewport: HTMLElement
): VirtualizationScrollAnchor {
  const scrollTop = viewport.scrollTop
  const viewportTop = viewport.getBoundingClientRect().top
  let turnId: string | null = null
  let bestDistance = Infinity

  for (const turnEl of viewport.querySelectorAll('[data-conversation-turn]')) {
    const id = turnEl.getAttribute('data-turn-id')
    if (!id) continue
    const distance = Math.abs(turnEl.getBoundingClientRect().top - viewportTop)
    if (distance < bestDistance) {
      bestDistance = distance
      turnId = id
    }
  }

  return { scrollTop, turnId }
}

export function findTurnIndexByUserMessageId(
  turns: readonly { user: { id: string } }[],
  messageId: string
): number {
  return turns.findIndex((turn) => turn.user.id === messageId)
}

/** Rough turn target from saved pixel scroll (virtualizer cold restore). */
export function estimateTurnIdFromScrollTop(
  turns: readonly { user: { id: string } }[],
  scrollTop: number,
  maxScrollTop: number
): string | null {
  if (turns.length === 0) return null
  if (maxScrollTop <= 0) return turns[0]?.user.id ?? null
  const ratio = Math.min(1, Math.max(0, scrollTop / maxScrollTop))
  const index = Math.min(turns.length - 1, Math.round(ratio * Math.max(0, turns.length - 1)))
  return turns[index]?.user.id ?? null
}

export function restoreScrollToTurnWhenReady(
  scrollToTurn: ((messageId: string) => void) | null,
  turnId: string | null,
  onFallback: () => void,
  attempt = 0
): void {
  if (turnId && scrollToTurn) {
    scrollToTurn(turnId)
    return
  }
  if (turnId && attempt < 12) {
    requestAnimationFrame(() =>
      restoreScrollToTurnWhenReady(scrollToTurn, turnId, onFallback, attempt + 1)
    )
    return
  }
  onFallback()
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
