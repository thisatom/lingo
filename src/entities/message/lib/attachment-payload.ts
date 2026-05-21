export const ATTACHMENT_REF_PREFIX = 'lingo-att:'

export function isAttachmentRef(payload: string): boolean {
  return payload.startsWith(ATTACHMENT_REF_PREFIX)
}

export function toAttachmentRef(attachmentId: string): string {
  return `${ATTACHMENT_REF_PREFIX}${attachmentId}`
}

export function attachmentIdFromRef(payload: string): string | null {
  if (!isAttachmentRef(payload)) return null
  const id = payload.slice(ATTACHMENT_REF_PREFIX.length).trim()
  return id || null
}

export function isInlineAttachmentPayload(payload: string): boolean {
  return payload.startsWith('data:') || (!isAttachmentRef(payload) && payload.length > 0)
}
