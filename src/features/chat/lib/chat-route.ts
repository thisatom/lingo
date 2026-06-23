import type { NavigateFunction } from 'react-router-dom'
import { useChatsStore } from '@/entities/chat/model/store'

export function chatRoutePath(chatId: string): string {
  return `/c/${encodeURIComponent(chatId)}`
}

export function navigateToChat(
  navigate: NavigateFunction,
  chatId: string,
  selectChat: (id: string) => void
): boolean {
  const exists = useChatsStore.getState().chats.some((chat) => chat.id === chatId)
  if (!exists) return false
  selectChat(chatId)
  navigate(chatRoutePath(chatId))
  return true
}
