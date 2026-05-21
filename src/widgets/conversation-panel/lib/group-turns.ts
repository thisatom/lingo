import type { Message } from '@/entities/message/model/types'
import { messageHasVisibleContent } from '@/shared/lib/chat-message-api'

export type ConversationTurn = {
  id: string
  user: Message
  assistantMessages: Message[]
}

export { messageHasVisibleContent }

export function groupMessagesIntoTurns(messages: readonly Message[]): ConversationTurn[] {
  const turns: ConversationTurn[] = []
  let user: Message | null = null
  let assistantMessages: Message[] = []

  const flush = () => {
    if (!user) return

    const visibleAssistants = assistantMessages.filter(messageHasVisibleContent)
    if (!messageHasVisibleContent(user) && visibleAssistants.length === 0) {
      user = null
      assistantMessages = []
      return
    }

    turns.push({ id: user.id, user, assistantMessages: visibleAssistants })
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
