/** In-memory scrollTop per chat (fast restore when switching chats in one session). */
const scrollTopByChatId = new Map<string, number>()

export function rememberChatScrollTop(chatId: string, scrollTop: number): void {
  if (scrollTop < 8) {
    scrollTopByChatId.delete(chatId)
    return
  }
  scrollTopByChatId.set(chatId, Math.round(scrollTop))
}

export function recallChatScrollTop(chatId: string): number | null {
  return scrollTopByChatId.get(chatId) ?? null
}
