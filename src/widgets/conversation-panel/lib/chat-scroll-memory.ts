/** In-memory scroll cache (survives ConversationPanel remount within the same session). */
const scrollByChatId = new Map<string, { scrollTop: number; userMessageId: string | null }>()

const MIN_SAVED_SCROLL_TOP_PX = 8

export function rememberChatScrollPosition(
  chatId: string,
  scrollTop: number,
  userMessageId: string | null
): void {
  if (scrollTop < MIN_SAVED_SCROLL_TOP_PX) {
    scrollByChatId.delete(chatId)
    return
  }
  scrollByChatId.set(chatId, {
    scrollTop: Math.round(scrollTop),
    userMessageId
  })
}

export function recallChatScrollPosition(chatId: string): {
  scrollTop: number
  userMessageId: string | null
} | null {
  return scrollByChatId.get(chatId) ?? null
}
