import type { MessageAttachment } from '../../entities/message/model/attachment'
import { isAttachmentRef, isInlineAttachmentPayload } from '../../entities/message/lib/attachment-payload'
import type { Message } from '../../entities/message/model/types'
import type { ChatContentPart, ChatMessagePayload } from '../types/ipc'
import { MAX_TEXT_CHARS_IN_API } from '@/features/chat-attachments/lib/constants'

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
      if (att.payload.startsWith('data:')) {
        parts.push({ type: 'image_url', image_url: { url: att.payload } })
      } else if (isAttachmentRef(att.payload)) {
        parts.push({
          type: 'text',
          text: `[Attached image: ${att.name} — still loading or unavailable]`
        })
      } else {
        parts.push({
          type: 'text',
          text: `[Attached image: ${att.name} — image is no longer available]`
        })
      }
    } else {
      let text = att.payload
      if (isAttachmentRef(text)) {
        parts.push({
          type: 'text',
          text: `[Attached file: ${att.name} — still loading or unavailable]`
        })
        continue
      }
      if (text.length > MAX_TEXT_CHARS_IN_API) {
        text = `${text.slice(0, MAX_TEXT_CHARS_IN_API)}\n… (truncated)`
      }
      parts.push({
        type: 'text',
        text: `**${att.name}**\n\`\`\`\n${text}\n\`\`\``
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
  if (message.role === 'thinking') {
    throw new Error('Thinking messages are not sent to the API')
  }
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
      (p.type === 'image_url' &&
        Boolean(p.image_url.url && isInlineAttachmentPayload(p.image_url.url) && p.image_url.url.startsWith('data:')))
  )
}

export function messageHasVisibleContent(message: Message): boolean {
  if (message.role === 'thinking') return true
  return message.content.trim().length > 0 || (message.attachments?.length ?? 0) > 0
}
