import { describe, expect, it, vi } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { toAttachmentRef } from '@/entities/message/lib/attachment-payload'
import {
  collectAttachmentIdsFromMessages,
  scheduleDeleteAttachmentBlobs
} from './attachment-cleanup'

vi.mock('@/entities/message/lib/attachment-storage', () => ({
  deleteAttachmentBlob: vi.fn(async () => undefined)
}))

import { deleteAttachmentBlob } from '@/entities/message/lib/attachment-storage'

function userMessage(id: string, attachmentId: string): Message {
  return {
    id,
    role: 'user',
    content: 'hello',
    createdAt: 0,
    attachments: [
      {
        id: attachmentId,
        kind: 'image',
        name: 'photo.png',
        mimeType: 'image/png',
        payload: toAttachmentRef(attachmentId),
        sizeBytes: 10
      }
    ]
  }
}

describe('attachment-cleanup', () => {
  it('collects attachment ids from message attachments', () => {
    expect(collectAttachmentIdsFromMessages([userMessage('u1', 'att-1')])).toEqual(['att-1'])
  })

  it('schedules blob deletion for collected ids', async () => {
    vi.mocked(deleteAttachmentBlob).mockClear()
    scheduleDeleteAttachmentBlobs(['att-1', 'att-2'])
    await Promise.resolve()
    expect(deleteAttachmentBlob).toHaveBeenCalledWith('att-1')
    expect(deleteAttachmentBlob).toHaveBeenCalledWith('att-2')
  })
})
