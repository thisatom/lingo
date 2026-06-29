import type { Chat } from '@/entities/chat/model/types'
import { formatChatDateLabel } from '@/shared/lib/chat-sidebar'
import { buildChatCommandSearchValue } from '@/features/chat-search/lib/chat-command-search'
import { chatMatchesQuery } from '@/features/chat-search/lib/chat-search-match'

const ARCHIVE_QUERY_PATTERN = /\b(archived?)\b/gi
const ARCHIVE_QUERY_DETECT = /\b(archived?)\b/i

function matchQueryWithoutArchiveKeywords(query: string): string {
  return query.replace(ARCHIVE_QUERY_PATTERN, ' ').replace(/\s+/g, ' ').trim()
}

/** Filter chats by title, id, dates, and message text. Excludes archived unless query mentions archive. */
export function filterChatsByQuery(chats: readonly Chat[], query: string): Chat[] {
  const includeArchived = ARCHIVE_QUERY_DETECT.test(query.trim())
  const matchQuery = matchQueryWithoutArchiveKeywords(query)

  const visible = includeArchived ? chats : chats.filter((chat) => !chat.archived)
  if (!matchQuery) return [...visible]

  return visible.filter((chat) =>
    chatMatchesQuery(
      chat,
      buildChatCommandSearchValue(chat, formatChatDateLabel(chat.updatedAt)),
      matchQuery
    )
  )
}
