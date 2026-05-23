import type { Message } from '@/entities/message/model/types'
import type { ChatContentPart, ChatMessagePayload } from '@/shared/types/ipc'
import { messageHasVisibleContent } from '@/shared/lib/chat-message-api'

/** Roles sent in chat/completions history (excludes thinking). */
export type ConversationalRole = 'user' | 'assistant'

function isConversationalRole(role: Message['role']): role is ConversationalRole {
  return role === 'user' || role === 'assistant'
}

function mergeTextContent(
  a: string | ChatContentPart[],
  b: string | ChatContentPart[]
): string | ChatContentPart[] {
  if (typeof a === 'string' && typeof b === 'string') {
    const left = a.trim()
    const right = b.trim()
    if (!left) return right
    if (!right) return left
    return `${left}\n\n${right}`
  }

  const partsA = typeof a === 'string' ? [{ type: 'text' as const, text: a }] : a
  const partsB = typeof b === 'string' ? [{ type: 'text' as const, text: b }] : b
  return [...partsA, ...partsB]
}

/**
 * Merges consecutive user/user or assistant/assistant turns.
 * Required by strict OpenAI-compatible hosts (e.g. NVIDIA integrate API, some Gemma deployments).
 */
export function normalizeAlternatingChatMessages(messages: readonly Message[]): Message[] {
  const merged: Message[] = []

  for (const message of messages) {
    if (!isConversationalRole(message.role) || !messageHasVisibleContent(message)) continue

    const last = merged[merged.length - 1]
    if (last && last.role === message.role) {
      merged[merged.length - 1] = {
        ...last,
        content: `${last.content.trim()}\n\n---\n\n${message.content.trim()}`.trim(),
        attachments: [...(last.attachments ?? []), ...(message.attachments ?? [])]
      }
      continue
    }

    merged.push(message)
  }

  while (merged.length > 0 && merged[0].role === 'assistant') {
    merged.shift()
  }

  return merged
}

export function normalizeAlternatingChatPayloads(
  messages: readonly ChatMessagePayload[]
): ChatMessagePayload[] {
  const merged: ChatMessagePayload[] = []

  for (const message of messages) {
    if (message.role !== 'user' && message.role !== 'assistant') continue

    const last = merged[merged.length - 1]
    if (last && last.role === message.role) {
      merged[merged.length - 1] = {
        role: message.role,
        content: mergeTextContent(last.content, message.content)
      }
      continue
    }

    merged.push({ role: message.role, content: message.content })
  }

  while (merged.length > 0 && merged[0].role === 'assistant') {
    merged.shift()
  }

  return merged
}
