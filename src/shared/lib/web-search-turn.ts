import type { ChatMessagePayload } from '@/shared/types/ipc'
import type { ChatStreamLlmSettings } from '@/shared/lib/resolve-chat-stream-llm'
import { extractPlainTextFromPayload } from '@/shared/lib/chat-message-api'
import { shouldForceWebSearch, shouldUseWebSearchForMessage } from '@/shared/lib/web-search-intent'

import type { Message } from '@/entities/message/model/types'

const ATTACHED_MARKER = /\[Attached (?:image|file):/i
const ATTACHED_FILE_BLOCK = /^\*\*[^*]+\*\*\n```/m

function apiUserContentHasAttachments(content: ChatMessagePayload['content']): boolean {
  if (typeof content === 'string') {
    return ATTACHED_MARKER.test(content) || ATTACHED_FILE_BLOCK.test(content)
  }
  if (content.some((part) => part.type === 'image_url')) return true
  const text = extractPlainTextFromPayload(content)
  return ATTACHED_MARKER.test(text) || ATTACHED_FILE_BLOCK.test(text)
}

/** Attachments on the latest user API turn (images or text files in payload). */
export function lastApiUserTurnHasAttachments(messages: readonly ChatMessagePayload[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role !== 'user') continue
    return apiUserContentHasAttachments(messages[i]!.content)
  }
  return false
}

export type StreamWebSearchDecision = {
  webSearchForTurn: boolean
  forceWebSearch: boolean
  blockedByAttachments: boolean
}

/** Stream-layer gate — matches renderer attachment policy; blocks force-search too. */
export function resolveWebSearchForStreamTurn(
  request: Pick<{ webSearch?: boolean }, 'webSearch'>,
  apiMessages: readonly ChatMessagePayload[],
  lastUserMessage: string
): StreamWebSearchDecision {
  const blockedByAttachments = lastApiUserTurnHasAttachments(apiMessages)
  if (blockedByAttachments) {
    return { webSearchForTurn: false, forceWebSearch: false, blockedByAttachments: true }
  }
  const forceWebSearch = shouldForceWebSearch(lastUserMessage)
  const webSearchForTurn =
    request.webSearch === true && shouldUseWebSearchForMessage(lastUserMessage)
  return { webSearchForTurn, forceWebSearch, blockedByAttachments: false }
}

export function threadHasUserAttachments(messages: readonly Message[]): boolean {
  return messages.some((m) => m.role === 'user' && (m.attachments?.length ?? 0) > 0)
}

/** Attachments on the latest user turn only — earlier image turns must not block later search. */
export function lastUserMessageHasAttachments(messages: readonly Message[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return (messages[i].attachments?.length ?? 0) > 0
    }
  }
  return false
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
  if (lastUserMessageHasAttachments(messages)) return false
  const text = lastUserMessageText(messages)
  if (!text) return false
  return shouldUseWebSearchForMessage(text)
}
