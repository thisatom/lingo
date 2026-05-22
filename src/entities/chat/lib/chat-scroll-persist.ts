/** Minimum scrollTop (px) to persist (below = treat as unset, reopen at bottom). */
export const CHAT_SCROLL_MIN_PX = 8

export type ChatScrollByChatId = Record<string, number>

export function isValidChatScrollTop(scrollTop: number | null | undefined): scrollTop is number {
  return scrollTop != null && scrollTop >= CHAT_SCROLL_MIN_PX
}

function scrollTopFromLegacyValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return isValidChatScrollTop(value) ? Math.round(value) : null
  }
  if (value && typeof value === 'object' && 'scrollTop' in value) {
    const top = (value as { scrollTop?: number }).scrollTop
    return isValidChatScrollTop(top) ? Math.round(top) : null
  }
  return null
}

/** Read scrollTop from a chat object saved before v5 (optional legacy field). */
export function chatScrollFromLegacyChat(chat: unknown): number | null {
  if (!chat || typeof chat !== 'object') return null
  const top = (chat as { scrollAnchorScrollTop?: number | null }).scrollAnchorScrollTop
  return scrollTopFromLegacyValue(top)
}

export function normalizeChatScrollByChatId(raw: unknown): ChatScrollByChatId {
  if (!raw || typeof raw !== 'object') return {}

  const out: ChatScrollByChatId = {}
  for (const [chatId, value] of Object.entries(raw as Record<string, unknown>)) {
    const top = scrollTopFromLegacyValue(value)
    if (top != null) out[chatId] = top
  }
  return out
}
