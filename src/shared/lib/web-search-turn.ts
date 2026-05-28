import type { Message } from '@/entities/message/model/types'
import type { ChatStreamLlmSettings } from '@/shared/lib/resolve-chat-stream-llm'

export function threadHasUserAttachments(messages: readonly Message[]): boolean {
  return messages.some((m) => m.role === 'user' && (m.attachments?.length ?? 0) > 0)
}

export function lastUserMessageText(messages: readonly Message[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content.trim()
  }
  return ''
}

/** Whether this agent turn should run local / OpenRouter web search. */
export function resolveWebSearchForChatTurn(
  settings: Pick<ChatStreamLlmSettings, 'webSearchEnabled'>,
  messages: readonly Message[]
): boolean {
  if (!settings.webSearchEnabled) return false
  if (threadHasUserAttachments(messages)) return false
  return lastUserMessageText(messages).trim().length > 0
}
