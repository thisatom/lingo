import type { Message } from '@/entities/message/model/types'

export function formatChatMessagesForCopy(messages: readonly Message[]): string {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => {
      const speaker =
        message.role === 'user'
          ? 'You'
          : message.role === 'thinking'
            ? 'Thinking'
            : 'Assistant'
      return `${speaker}:\n${message.content.trim()}`
    })
    .join('\n\n---\n\n')
}
