import type { Message } from '@/entities/message/model/types'

/** Re-sync turn tail ids/text from persisted messages after stream handlers (rAF / flush races). */
export function reconcileTurnMessagesFromStore(
  messages: Message[],
  thinkingMessageId: string | null,
  assistantMessageId: string | null,
  finalText: string,
  finalThinkingText: string
): {
  thinkingMessageId: string | null
  assistantMessageId: string | null
  finalText: string
  finalThinkingText: string
} {
  const lastThinking = [...messages].reverse().find((m) => m.role === 'thinking')
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')

  const resolvedThinkingId = thinkingMessageId ?? lastThinking?.id ?? null
  const resolvedAssistantId = assistantMessageId ?? lastAssistant?.id ?? null
  const resolvedFinalText = finalText.trim() || lastAssistant?.content.trim() || ''
  const resolvedThinkingText =
    finalThinkingText.trim() || lastThinking?.content.trim() || ''

  return {
    thinkingMessageId: resolvedThinkingId,
    assistantMessageId: resolvedAssistantId,
    finalText: resolvedFinalText,
    finalThinkingText: resolvedThinkingText
  }
}
