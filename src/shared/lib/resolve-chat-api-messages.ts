import type { Message } from '@/entities/message/model/types'
import { buildUserApiContent, messageToApiPayload } from '@/shared/lib/chat-message-api'
import type { ChatMessagePayload } from '@/shared/types/ipc'
import { resolveAttachments } from '@/entities/message/lib/prepare-attachment'

export async function resolveMessagesForApi(
  messages: Pick<Message, 'role' | 'content' | 'attachments'>[]
): Promise<ChatMessagePayload[]> {
  return Promise.all(
    messages.map(async (message) => {
      if (message.role === 'user' && (message.attachments?.length ?? 0) > 0) {
        const attachments = await resolveAttachments(message.attachments)
        const text = message.content.trim() ? message.content : '(See attached files)'
        return { role: 'user' as const, content: buildUserApiContent(text, attachments) }
      }
      return messageToApiPayload(message)
    })
  )
}
