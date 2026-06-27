import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { Message } from '@/entities/message/model/types'
import { attachmentIdFromRef, isAttachmentRef } from '@/entities/message/lib/attachment-payload'
import { deleteAttachmentBlob } from '@/entities/message/lib/attachment-storage'

export function collectAttachmentIds(attachments: readonly MessageAttachment[]): string[] {
  const ids = new Set<string>()
  for (const att of attachments) {
    const id = isAttachmentRef(att.payload)
      ? (attachmentIdFromRef(att.payload) ?? att.id)
      : att.id
    if (id) ids.add(id)
  }
  return [...ids]
}

export function collectAttachmentIdsFromMessages(messages: readonly Message[]): string[] {
  const ids = new Set<string>()
  for (const message of messages) {
    for (const id of collectAttachmentIds(message.attachments ?? [])) {
      ids.add(id)
    }
  }
  return [...ids]
}

export function scheduleDeleteAttachmentBlobs(ids: readonly string[]): void {
  if (ids.length === 0) return
  void Promise.allSettled(ids.map((id) => deleteAttachmentBlob(id)))
}

export function scheduleDeleteAttachmentsFromMessages(messages: readonly Message[]): void {
  scheduleDeleteAttachmentBlobs(collectAttachmentIdsFromMessages(messages))
}
