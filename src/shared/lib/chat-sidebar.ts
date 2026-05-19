import type { Chat } from '@/entities/chat/model/types'

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

export function sortChatsForSidebar(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => {
    const aPinned = Boolean(a.pinned)
    const bPinned = Boolean(b.pinned)
    if (aPinned !== bPinned) return aPinned ? -1 : 1
    return b.updatedAt - a.updatedAt
  })
}

export function groupChatsByDate(chats: Chat[]): ChatDateGroup[] {
  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)
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
export function flattenSidebarChats(chats: Chat[], showDateGroups: boolean): Chat[] {
  const pinned = chats.filter((c) => c.pinned)
  const unpinned = chats.filter((c) => !c.pinned)
  if (showDateGroups) {
    return [...pinned, ...groupChatsByDate(unpinned).flatMap((g) => g.chats)]
  }
  return sortChatsForSidebar(chats)
}
