import type { Message } from '@/entities/message/model/types'

function isOrphanAssistantTailMessage(message: Message): boolean {
  if (message.role === 'thinking') return true
  if (message.role === 'assistant' && !message.content.trim()) return true
  return false
}

/** Message ids to remove before appending a new user question (stopped turn leftovers). */
export function findOrphanAssistantTailIds(messages: readonly Message[]): string[] {
  const ids: string[] = []
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role === 'user') break
    if (isOrphanAssistantTailMessage(message)) {
      ids.push(message.id)
      continue
    }
    break
  }
  return ids.reverse()
}
