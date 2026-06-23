/** Local chat primary key: `chat-{timestamp}-{random}`. */
export const CHAT_ID_PATTERN = /^chat-\d+-[a-z0-9]+$/

export function isChatId(value: string): boolean {
  return CHAT_ID_PATTERN.test(value.trim())
}

/** Extract a chat id from plain id, hash route, or pasted URL fragment. */
export function parseChatIdFromInput(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (isChatId(trimmed)) return trimmed

  const routeMatch = trimmed.match(/(?:#|\/)c\/(chat-\d+-[a-z0-9]+)/i)
  if (routeMatch?.[1]) return routeMatch[1]

  const embeddedMatch = trimmed.match(/(chat-\d+-[a-z0-9]+)/i)
  return embeddedMatch?.[1] && isChatId(embeddedMatch[1]) ? embeddedMatch[1] : null
}
