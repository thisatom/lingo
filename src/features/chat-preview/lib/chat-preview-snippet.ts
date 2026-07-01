import type { Chat } from '@/entities/chat/model/types'

const DEFAULT_MAX_LENGTH = 180

/** Plain-text excerpt of the latest non-thinking message for sidebar / hover previews. */
export function getChatPreviewSnippet(
  chat: Chat,
  maxLength: number = DEFAULT_MAX_LENGTH
): string | null {
  for (let index = chat.messages.length - 1; index >= 0; index -= 1) {
    const message = chat.messages[index]
    if (message.role === 'thinking') continue

    const raw = message.content.trim()
    if (!raw) continue

    const plain = raw
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#>*_~\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!plain) continue
    if (plain.length <= maxLength) return plain
    return `${plain.slice(0, maxLength).trim()}…`
  }

  return null
}

export function countChatMessages(chat: Chat): number {
  return chat.messages.filter((message) => message.role !== 'thinking').length
}
