import type { Chat } from '@/entities/chat/model/types'

const SNIPPET_RADIUS = 42

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

function buildHaystack(chat: Chat, metadata: string): string {
  const messageText = chat.messages.map((message) => message.content).join(' ')
  return `${metadata} ${messageText}`.toLowerCase()
}

/** Short excerpt when the query matches message text. */
export function findChatMessageSnippet(chat: Chat, query: string): string | null {
  const normalized = normalizeQuery(query)
  if (!normalized) return null

  for (const message of chat.messages) {
    const content = message.content.trim()
    if (!content) continue
    const lower = content.toLowerCase()
    const index = lower.indexOf(normalized)
    if (index < 0) continue

    const start = Math.max(0, index - SNIPPET_RADIUS)
    const end = Math.min(content.length, index + normalized.length + SNIPPET_RADIUS)
    const prefix = start > 0 ? '…' : ''
    const suffix = end < content.length ? '…' : ''
    return `${prefix}${content.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`
  }

  return null
}

export function chatMatchesQuery(chat: Chat, metadata: string, query: string): boolean {
  const normalized = normalizeQuery(query)
  if (!normalized) return true
  return buildHaystack(chat, metadata).includes(normalized)
}
