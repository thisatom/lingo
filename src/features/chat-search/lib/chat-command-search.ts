import type { Chat } from '@/entities/chat/model/types'
import {
  formatChatDateLabel,
  groupChatsByDate,
  sortChatsForSidebar,
  type ChatDateGroup,
  type SidebarChatSort
} from '@/shared/lib/chat-sidebar'

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
})

export function buildChatCommandSearchValue(chat: Chat, dateLabel: string): string {
  const updated = new Date(chat.updatedAt)
  const created = new Date(chat.createdAt)
  return [
    chat.title,
    chat.id,
    dateLabel,
    formatChatDateLabel(chat.updatedAt),
    shortDateFormatter.format(updated),
    shortDateFormatter.format(created),
    updated.toLocaleDateString(),
    created.toLocaleDateString(),
    String(updated.getFullYear()),
    String(updated.getMonth() + 1),
    String(updated.getDate())
  ].join(' ')
}

export type ChatCommandSearchGroups = {
  pinned: Chat[]
  dateGroups: ChatDateGroup[]
  flat: Chat[]
}

export function buildChatCommandSearchGroups(
  chats: Chat[],
  showDateGroups: boolean,
  sort: SidebarChatSort
): ChatCommandSearchGroups {
  const pinned = sortChatsForSidebar(
    chats.filter((c) => c.pinned),
    'updated-desc'
  )
  const unpinned = chats.filter((c) => !c.pinned)

  if (showDateGroups) {
    return {
      pinned,
      dateGroups: groupChatsByDate(unpinned, sort),
      flat: []
    }
  }

  return {
    pinned: [],
    dateGroups: [],
    flat: sortChatsForSidebar(chats, sort)
  }
}
