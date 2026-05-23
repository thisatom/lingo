import type { Message } from '@/entities/message/model/types'
import { messageHasVisibleContent } from '@/shared/lib/chat-message-api'

export type ConversationTurn = {
  id: string
  user: Message
  assistantMessages: Message[]
}

export { messageHasVisibleContent }

export function lastAssistantMessageId(messages: readonly Message[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') return messages[i].id
  }
  return undefined
}

/** True while reasoning streams and the final answer for this turn has not started yet. */
export function isThinkingMessageLive(
  turn: Pick<ConversationTurn, 'assistantMessages'>,
  messageId: string,
  agentBusy: boolean,
  isLatestTurn: boolean
): boolean {
  if (!agentBusy || !isLatestTurn) return false

  const index = turn.assistantMessages.findIndex((m) => m.id === messageId)
  if (index === -1 || turn.assistantMessages[index]?.role !== 'thinking') return false

  return !turn.assistantMessages
    .slice(index + 1)
    .some((message) => message.role === 'assistant')
}

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
    if ((message.role === 'assistant' || message.role === 'thinking') && user) {
      assistantMessages.push(message)
    }
  }

  flush()
  return turns
}
