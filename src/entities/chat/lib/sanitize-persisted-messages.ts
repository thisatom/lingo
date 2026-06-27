import type { Chat } from '@/entities/chat/model/types'
import type { Message } from '@/entities/message/model/types'
import { stripAssistantRoleMarkup } from '@/shared/lib/strip-assistant-role-markup'

/** Clean legacy assistant/thinking leaks when loading persisted chats. */
export function sanitizePersistedMessageContent(message: Message): Message {
  if (message.role !== 'assistant' && message.role !== 'thinking') {
    return message
  }

  const cleaned = stripAssistantRoleMarkup(message.content)
  return cleaned === message.content ? message : { ...message, content: cleaned }
}

export function sanitizePersistedChats(chats: Chat[]): Chat[] {
  let changed = false

  const next = chats.map((chat) => {
    let chatChanged = false
    const messages = chat.messages.map((message) => {
      const sanitized = sanitizePersistedMessageContent(message)
      if (sanitized !== message) chatChanged = true
      return sanitized
    })
    if (!chatChanged) return chat
    changed = true
    return { ...chat, messages }
  })

  return changed ? next : chats
}
