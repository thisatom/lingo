import type { Message } from '@/entities/message/model/types'

export function formatChatMessagesForCopy(messages: Message[]): string {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => {
      const speaker = message.role === 'user' ? 'You' : 'Assistant'
      return `${speaker}:\n${message.content.trim()}`
    })
    .join('\n\n---\n\n')
}
