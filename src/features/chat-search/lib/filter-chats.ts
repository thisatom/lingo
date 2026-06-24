import type { Chat } from '@/entities/chat/model/types'
import { formatChatDateLabel } from '@/shared/lib/chat-sidebar'
import { buildChatCommandSearchValue } from '@/features/chat-search/lib/chat-command-search'

function buildChatSearchHaystack(chat: Chat): string {
  const metadata = buildChatCommandSearchValue(
    chat,
    formatChatDateLabel(chat.updatedAt)
  )
  const messageText = chat.messages.map((message) => message.content).join(' ')
  return `${metadata} ${messageText}`.toLowerCase()
}

/** Filter chats by title, id, dates, and message text. */
export function filterChatsByQuery(chats: readonly Chat[], query: string): Chat[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return [...chats]
  return chats.filter((chat) => buildChatSearchHaystack(chat).includes(normalized))
}
