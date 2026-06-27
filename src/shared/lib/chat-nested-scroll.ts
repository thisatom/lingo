/** Nested scroll regions inside chat (code blocks, tables) — wheel should not pause chat follow. */
export const CHAT_NESTED_SCROLL_ATTR = 'data-chat-nested-scroll'

export function wheelScrollsChatNestedTarget(
  target: EventTarget | null,
  deltaY: number
): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false
  const nested = (target as Element).closest(`[${CHAT_NESTED_SCROLL_ATTR}]`) as HTMLElement | null
  if (!nested) return false

  const maxScroll = nested.scrollHeight - nested.clientHeight
  if (maxScroll <= 1) return false

  if (deltaY > 0 && nested.scrollTop < maxScroll - 1) return true
  if (deltaY < 0 && nested.scrollTop > 1) return true
  return false
}
