import type { Chat } from '@/entities/chat/model/types'

export type SidebarChatSort =
  | 'updated-desc'
  | 'updated-asc'
  | 'name-asc'
  | 'name-desc'
  | 'created-desc'
  | 'created-asc'

const SIDEBAR_CHAT_SORT_VALUES: SidebarChatSort[] = [
  'updated-desc',
  'updated-asc',
  'name-asc',
  'name-desc',
  'created-desc',
  'created-asc'
]

export function isSidebarChatSort(value: unknown): value is SidebarChatSort {
  return typeof value === 'string' && SIDEBAR_CHAT_SORT_VALUES.includes(value as SidebarChatSort)
}

export const SIDEBAR_CHAT_SORT_OPTIONS: {
  value: SidebarChatSort
  label: string
}[] = [
  { value: 'updated-desc', label: 'Newest first' },
  { value: 'updated-asc', label: 'Oldest first' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'created-desc', label: 'Recently created' },
  { value: 'created-asc', label: 'Oldest created' }
]

export interface ChatDateGroup {
  dateKey: string
  label: string
  chats: Chat[]
}

const dateLabelFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

function startOfLocalDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function formatChatDateLabel(timestamp: number): string {
  return dateLabelFormatter.format(new Date(timestamp))
}

function compareChats(a: Chat, b: Chat, sort: SidebarChatSort): number {
  switch (sort) {
    case 'name-asc':
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    case 'name-desc':
      return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' })
    case 'created-asc':
      return a.createdAt - b.createdAt
    case 'created-desc':
      return b.createdAt - a.createdAt
    case 'updated-asc':
      return a.updatedAt - b.updatedAt
    case 'updated-desc':
    default:
      return b.updatedAt - a.updatedAt
  }
}

export function sortChatsForSidebar(
  chats: Chat[],
  sort: SidebarChatSort = 'updated-desc'
): Chat[] {
  return [...chats].sort((a, b) => {
    const aPinned = Boolean(a.pinned)
    const bPinned = Boolean(b.pinned)
    if (aPinned !== bPinned) return aPinned ? -1 : 1
    return compareChats(a, b, sort)
  })
}

export function groupChatsByDate(
  chats: Chat[],
  sort: SidebarChatSort = 'updated-desc'
): ChatDateGroup[] {
  const sorted = [...chats].sort((a, b) => compareChats(a, b, sort))
  const groups = new Map<string, ChatDateGroup>()

  for (const chat of sorted) {
    const dayStart = startOfLocalDay(chat.updatedAt)
    const dateKey = String(dayStart)
    const existing = groups.get(dateKey)
    if (existing) {
      existing.chats.push(chat)
    } else {
      groups.set(dateKey, {
        dateKey,
        label: formatChatDateLabel(chat.updatedAt),
        chats: [chat]
      })
    }
  }

  return Array.from(groups.values())
}

/** Flat order as rendered in the sidebar (pinned → date groups or sorted unpinned). */
export function flattenSidebarChats(
  chats: Chat[],
  showDateGroups: boolean,
  sort: SidebarChatSort = 'updated-desc'
): Chat[] {
  const pinned = sortChatsForSidebar(
    chats.filter((c) => c.pinned),
    'updated-desc'
  )
  const unpinned = chats.filter((c) => !c.pinned)
  if (showDateGroups) {
    return [...pinned, ...groupChatsByDate(unpinned, sort).flatMap((g) => g.chats)]
  }
  return sortChatsForSidebar(chats, sort)
}
