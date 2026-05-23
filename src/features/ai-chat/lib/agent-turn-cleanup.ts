import { useChatsStore } from '@/entities/chat/model/store'
import type { Message } from '@/entities/message/model/types'

/** First thinking/assistant message id in the same turn as `anchorMessageId` (for removeMessagesFrom). */
export function findTurnTailRemoveId(
  messages: readonly Message[],
  anchorMessageId: string
): string | null {
  const index = messages.findIndex((m) => m.id === anchorMessageId)
  if (index === -1) return null

  let userIndex = index
  while (userIndex > 0 && messages[userIndex].role !== 'user') {
    userIndex -= 1
  }
  if (messages[userIndex]?.role !== 'user') return anchorMessageId

  for (let i = userIndex + 1; i <= index; i++) {
    const role = messages[i].role
    if (role === 'thinking' || role === 'assistant') {
      return messages[i].id
    }
  }

  return anchorMessageId
}

export function agentTurnTailMessageId(
  thinkingMessageId: string | null,
  assistantMessageId: string | null
): string | null {
  return thinkingMessageId ?? assistantMessageId
}

/** True when the assistant reply for this turn is already in the chat store. */
export function hasPersistedAssistantTurn(
  targetChatId: string,
  assistantMessageId: string | null,
  finalText: string
): boolean {
  if (!assistantMessageId) return false
  if (finalText.trim()) return true
  const chat = useChatsStore.getState().chats.find((c) => c.id === targetChatId)
  const message = chat?.messages.find((m) => m.id === assistantMessageId)
  return Boolean(message?.content.trim())
}

export function removeAgentTurnTail(
  removeMessagesFrom: (messageId: string, targetChatId?: string) => void,
  targetChatId: string,
  thinkingMessageId: string | null,
  assistantMessageId: string | null
): void {
  const id = agentTurnTailMessageId(thinkingMessageId, assistantMessageId)
  if (id) removeMessagesFrom(id, targetChatId)
}

/** Drops in-flight tail unless a completed assistant answer should stay in the thread. */
export function removeAgentTurnTailUnlessPersisted(
  removeMessagesFrom: (messageId: string, targetChatId?: string) => void,
  targetChatId: string,
  thinkingMessageId: string | null,
  assistantMessageId: string | null,
  finalText: string
): void {
  if (hasPersistedAssistantTurn(targetChatId, assistantMessageId, finalText)) return
  removeAgentTurnTail(
    removeMessagesFrom,
    targetChatId,
    thinkingMessageId,
    assistantMessageId
  )
}
