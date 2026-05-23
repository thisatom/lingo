import type { Message } from '@/entities/message/model/types'

export function getThinkingDurationMs(
  thinking: Pick<Message, 'id' | 'createdAt' | 'content'>,
  assistantMessages: readonly Message[],
  streamEndedAt?: number
): number {
  const index = assistantMessages.findIndex((m) => m.id === thinking.id)
  const nextAssistant = assistantMessages
    .slice(index + 1)
    .find((message) => message.role === 'assistant')
  const endAt = nextAssistant?.createdAt ?? streamEndedAt ?? Date.now()
  const elapsed = endAt - thinking.createdAt
  if (elapsed >= 1000) return elapsed
  const estimateFromLength = 800 + thinking.content.trim().length * 18
  return Math.max(1000, elapsed > 0 ? elapsed : estimateFromLength)
}

export function formatThoughtDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000))
  if (seconds < 60) {
    return `Thought for ${seconds} ${seconds === 1 ? 'second' : 'seconds'}`
  }
  const minutes = Math.max(1, Math.round(seconds / 60))
  return `Thought for ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
}
