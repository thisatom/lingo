import { describe, expect, it } from 'vitest'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import {
  attachmentFingerprint,
  mergeComposerAttachments
} from '@/features/chat-attachments/lib/merge-composer-attachments'

function attachment(
  overrides: Partial<MessageAttachment> & Pick<MessageAttachment, 'id' | 'name'>
): MessageAttachment {
  return {
    kind: 'text',
    mimeType: 'text/plain',
    sizeBytes: 100,
    payload: 'hello',
    ...overrides
  }
}

describe('mergeComposerAttachments', () => {
  it('dedupes by kind, name, and size', () => {
    const existing = [attachment({ id: '1', name: 'a.txt', sizeBytes: 10 })]
    const incoming = [
      attachment({ id: '2', name: 'a.txt', sizeBytes: 10 }),
      attachment({ id: '3', name: 'b.txt', sizeBytes: 20 })
    ]

    expect(mergeComposerAttachments(existing, incoming)).toEqual([incoming[1]])
  })

  it('merges all deduped incoming items', () => {
    const existing = Array.from({ length: 99 }, (_, index) =>
      attachment({ id: `e-${index}`, name: `e-${index}.txt`, sizeBytes: index })
    )
    const incoming = [
      attachment({ id: 'n-1', name: 'new-1.txt', sizeBytes: 1 }),
      attachment({ id: 'n-2', name: 'new-2.txt', sizeBytes: 2 })
    ]

    expect(mergeComposerAttachments(existing, incoming)).toHaveLength(2)
  })

  it('builds stable fingerprints', () => {
    const item = attachment({ id: '1', name: 'doc.pdf', kind: 'text', sizeBytes: 42 })
    expect(attachmentFingerprint(item)).toBe(`text\0doc.pdf\0${42}`)
  })
})
