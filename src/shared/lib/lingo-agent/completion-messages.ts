import type { ModelMessage } from 'ai'
import type { ChatMessagePayload } from '@/shared/types/ipc'

type CompletionMessage = {
  role: string
  content: string | ChatMessagePayload['content']
}

const API_ROLES = new Set(['system', 'user', 'assistant'])

export function completionMessagesToModelMessages(
  messages: CompletionMessage[]
): ModelMessage[] {
  const out: ModelMessage[] = []

  for (const message of messages) {
    if (!API_ROLES.has(message.role)) continue

    const role = message.role as 'system' | 'user' | 'assistant'

    if (typeof message.content === 'string') {
      out.push({ role, content: message.content })
      continue
    }

    const parts = message.content
      .map((part) => {
        if (part.type === 'text') {
          return { type: 'text' as const, text: part.text }
        }
        if (part.type === 'image_url') {
          return { type: 'image' as const, image: part.image_url.url }
        }
        return null
      })
      .filter((part): part is { type: 'text'; text: string } | { type: 'image'; image: string } =>
        part != null && (part.type !== 'text' || part.text.trim().length > 0)
      )

    if (parts.length === 0) continue
    out.push({ role, content: parts })
  }

  return out
}
