/** Neutral label in the main chat header (sidebar keeps the full chat title). */
export const CHAT_HEADER_LABEL = 'Chat'

export function getChatHeaderDisplayTitle(_title?: string | null): string {
  return CHAT_HEADER_LABEL
}
