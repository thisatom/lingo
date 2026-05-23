import type { MessageAttachment } from '@/entities/message/model/attachment'
import {
  attachmentIdFromRef,
  isAttachmentRef,
  isInlineAttachmentPayload,
  toAttachmentRef
} from '@/entities/message/lib/attachment-payload'
import { loadAttachmentBlob, saveAttachmentBlob } from '@/entities/message/lib/attachment-storage'

const resolvedPayloadCache = new Map<string, string>()

export async function persistAttachment(att: MessageAttachment): Promise<MessageAttachment> {
  if (isAttachmentRef(att.payload)) return att

  const payload = att.payload.trim()
  if (!payload) return att

  await saveAttachmentBlob(att.id, payload)
  resolvedPayloadCache.delete(att.id)
  return { ...att, payload: toAttachmentRef(att.id) }
}

export async function persistAttachments(
  attachments: MessageAttachment[]
): Promise<MessageAttachment[]> {
  return Promise.all(attachments.map((att) => persistAttachment(att)))
}

export async function resolveAttachmentPayload(att: MessageAttachment): Promise<string> {
  if (isInlineAttachmentPayload(att.payload) && !isAttachmentRef(att.payload)) {
    return att.payload
  }

  const id = attachmentIdFromRef(att.payload) ?? att.id
  const cached = resolvedPayloadCache.get(id)
  if (cached !== undefined) return cached

  const stored = await loadAttachmentBlob(id)
  const payload = stored ?? ''
  if (payload) resolvedPayloadCache.set(id, payload)
  return payload
}

export async function resolveAttachments(
  attachments: MessageAttachment[] | undefined
): Promise<MessageAttachment[]> {
  if (!attachments?.length) return []
  return Promise.all(
    attachments.map(async (att) => ({
      ...att,
      payload: await resolveAttachmentPayload(att)
    }))
  )
}
