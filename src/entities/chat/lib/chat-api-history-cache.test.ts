import { describe, expect, it } from 'vitest'
import { messageSig } from './chat-api-history-cache'
import type { Message } from '@/entities/message/model/types'

function msg(content: string): Message {
  return { id: 'm1', role: 'user', content, createdAt: 0 }
}

describe('messageSig', () => {
  it('differs when only middle characters change', () => {
    const a = msg('hello world')
    const b = msg('hello wxrld')
    expect(messageSig(a)).not.toBe(messageSig(b))
  })

  it('differs when attachments change but text stays the same', () => {
    const base = msg('same caption')
    const withImage = {
      ...base,
      attachments: [
        {
          id: 'att-1',
          kind: 'image' as const,
          name: 'a.png',
          mimeType: 'image/png',
          payload: 'data:image/png;base64,abc',
          sizeBytes: 3
        }
      ]
    }
    const withOtherImage = {
      ...base,
      attachments: [{ ...withImage.attachments![0], id: 'att-2' }]
    }
    expect(messageSig(base)).not.toBe(messageSig(withImage))
    expect(messageSig(withImage)).not.toBe(messageSig(withOtherImage))
  })
})
