import type { Message } from '@/entities/message/model/types'
import type { MessageAttachment } from '@/entities/message/model/attachment'

export type SubmitEditedUserMessageResult = { rollbackToEdit: string } | void

export type EditMessageSnapshot = {
  messageId: string
  content: string
  attachments: MessageAttachment[] | undefined
  trailingMessages: Message[]
}

export function snapshotUserMessageEdit(
  messages: Message[],
  messageId: string
): EditMessageSnapshot | null {
  const index = messages.findIndex((m) => m.id === messageId)
  if (index === -1) return null
  const message = messages[index]
  if (message.role !== 'user') return null

  return {
    messageId,
    content: message.content,
    attachments: message.attachments ? [...message.attachments] : undefined,
    trailingMessages: messages.slice(index + 1).map((m) => ({ ...m }))
  }
}

export function restoreUserMessageEdit(
  messages: Message[],
  snapshot: EditMessageSnapshot
): Message[] {
  const index = messages.findIndex((m) => m.id === snapshot.messageId)
  if (index === -1) return messages

  const head = messages.slice(0, index)
  const edited = messages[index]
  const restoredUser: Message = {
    ...edited,
    content: snapshot.content,
    attachments: snapshot.attachments
  }

  return [...head, restoredUser, ...snapshot.trailingMessages]
}
