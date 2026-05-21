import type { MessageAttachment } from '../../entities/message/model/attachment'
import type { Message } from '../../entities/message/model/types'
import type { ChatContentPart, ChatMessagePayload } from '../types/ipc'

export function buildUserApiContent(
  text: string,
  attachments?: MessageAttachment[]
): string | ChatContentPart[] {
  const parts: ChatContentPart[] = []
  const trimmed = text.trim()

  if (trimmed) {
    parts.push({ type: 'text', text: trimmed })
  }

  for (const att of attachments ?? []) {
    if (att.kind === 'image') {
      parts.push({ type: 'image_url', image_url: { url: att.payload } })
    } else {
      parts.push({
        type: 'text',
        text: `**${att.name}**\n\`\`\`\n${att.payload}\n\`\`\``
      })
    }
  }

  if (parts.length === 0) return ''
  if (parts.length === 1 && parts[0].type === 'text') return parts[0].text
  return parts
}

export function messageToApiPayload(
  message: Pick<Message, 'role' | 'content' | 'attachments'>
): ChatMessagePayload {
  if (message.role === 'user' && (message.attachments?.length ?? 0) > 0) {
    const text = message.content.trim() ? message.content : '(See attached files)'
    return { role: 'user', content: buildUserApiContent(text, message.attachments) }
  }
  return { role: message.role, content: message.content }
}

export function extractPlainTextFromPayload(
  content: string | ChatContentPart[]
): string {
  if (typeof content === 'string') return content
  return content
    .filter((p): p is Extract<ChatContentPart, { type: 'text' }> => p.type === 'text')
    .map((p) => p.text)
    .join('\n')
}

export function messageHasApiContent(payload: ChatMessagePayload): boolean {
  if (typeof payload.content === 'string') return payload.content.trim().length > 0
  return payload.content.some(
    (p: ChatContentPart) =>
      (p.type === 'text' && p.text.trim().length > 0) ||
      (p.type === 'image_url' && Boolean(p.image_url.url))
  )
}

export function messageHasVisibleContent(message: Message): boolean {
  return message.content.trim().length > 0 || (message.attachments?.length ?? 0) > 0
}
