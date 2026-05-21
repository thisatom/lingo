import type { Message } from '@/entities/message/model/types'
import { buildUserApiContent, messageToApiPayload } from '@/shared/lib/chat-message-api'
import type { ChatMessagePayload } from '@/shared/types/ipc'
import { resolveAttachments } from '@/entities/message/lib/prepare-attachment'

export async function resolveMessagesForApi(
  messages: Pick<Message, 'role' | 'content' | 'attachments'>[]
): Promise<ChatMessagePayload[]> {
  const out: ChatMessagePayload[] = []

  for (const message of messages) {
    if (message.role === 'user' && (message.attachments?.length ?? 0) > 0) {
      const attachments = await resolveAttachments(message.attachments)
      const text = message.content.trim() ? message.content : '(See attached files)'
      out.push({ role: 'user', content: buildUserApiContent(text, attachments) })
      continue
    }
    out.push(messageToApiPayload(message))
  }

  return out
}
