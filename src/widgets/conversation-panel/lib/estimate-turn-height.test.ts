import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { estimateTurnHeightPx } from './estimate-turn-height'

function msg(role: Message['role'], content: string): Message {
  return { id: role, role, content, createdAt: 0 }
}

describe('estimateTurnHeightPx', () => {
  it('accounts for thinking and assistant content', () => {
    const short = estimateTurnHeightPx({
      id: 'u1',
      user: msg('user', 'hi'),
      assistantMessages: [msg('thinking', ''), msg('assistant', 'ok')]
    })
    const long = estimateTurnHeightPx({
      id: 'u2',
      user: msg('user', 'question'),
      assistantMessages: [
        msg('thinking', 'x'.repeat(800)),
        msg('assistant', 'y'.repeat(2000))
      ]
    })
    expect(long).toBeGreaterThan(short)
  })

  it('accounts for attachments, code blocks, and search sources', () => {
    const plain = estimateTurnHeightPx({
      id: 'u1',
      user: msg('user', 'hi'),
      assistantMessages: [msg('assistant', 'ok')]
    })
    const rich = estimateTurnHeightPx({
      id: 'u2',
      user: {
        ...msg('user', 'see attached'),
        attachments: [
          {
            id: 'a1',
            kind: 'image',
            name: 'photo.png',
            mimeType: 'image/png',
            payload: 'data:image/png;base64,abc',
            sizeBytes: 12
          }
        ]
      },
      assistantMessages: [
        {
          ...msg('assistant', '```ts\nconsole.log(1)\n```'),
          searchSources: [
            { title: 'Docs', url: 'https://example.com' },
            { title: 'Guide', url: 'https://example.org' }
          ]
        }
      ]
    })
    expect(rich).toBeGreaterThan(plain)
  })
})
