import type { MessageAttachment } from '@/entities/message/model/attachment'

export function attachmentFingerprint(item: Pick<MessageAttachment, 'name' | 'sizeBytes' | 'kind'>): string {
  return `${item.kind}\0${item.name}\0${item.sizeBytes}`
}

/** Dedupe by name/size/kind. */
export function mergeComposerAttachments(
  existing: readonly MessageAttachment[],
  incoming: readonly MessageAttachment[]
): MessageAttachment[] {
  if (incoming.length === 0) return []

  const seen = new Set(existing.map(attachmentFingerprint))
  const merged: MessageAttachment[] = []

  for (const item of incoming) {
    const key = attachmentFingerprint(item)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(item)
  }

  return merged
}
