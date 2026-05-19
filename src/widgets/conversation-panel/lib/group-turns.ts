import type { Message } from '@/entities/message/model/types'

export type ConversationTurn = {
  id: string
  user: Message
  assistantMessages: Message[]
}

export function groupMessagesIntoTurns(messages: Message[]): ConversationTurn[] {
  const turns: ConversationTurn[] = []
  let user: Message | null = null
  let assistantMessages: Message[] = []

  const flush = () => {
    if (!user) return
    turns.push({ id: user.id, user, assistantMessages })
    user = null
    assistantMessages = []
  }

  for (const message of messages) {
    if (message.role === 'user') {
      flush()
      user = message
      continue
    }
    if (message.role === 'assistant' && user) {
      assistantMessages.push(message)
    }
  }

  flush()
  return turns
}
