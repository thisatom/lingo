import { describe, expect, it } from 'vitest'

import type { Message } from '@/entities/message/model/types'

import { resolveWebSearchForChatTurn, resolveWebSearchForStreamTurn } from './web-search-turn'

function user(id: string, content: string, attachments?: Message['attachments']): Message {
  return { id, role: 'user', content, createdAt: 0, attachments }
}

describe('resolveWebSearchForChatTurn', () => {
  const settings = { webSearchEnabled: true }

  it('runs for factual questions when web search toggle is on', () => {
    const messages = [
      user('u1', 'hi'),
      user('u2', 'What is quantum computing in simple terms?')
    ]
    expect(resolveWebSearchForChatTurn(settings, messages)).toBe(true)
  })

  it('skips when the current user turn has attachments', () => {
    const messages = [
      user('u1', 'explain this image', [
        {
          id: 'a',
          kind: 'image',
          name: 'photo.png',
          mimeType: 'image/png',
          sizeBytes: 1,
          payload: 'data:image/png;base64,AA=='
        }
      ])
    ]
    expect(resolveWebSearchForChatTurn(settings, messages)).toBe(false)
  })

  it('allows search on a later text-only turn after an earlier attachment', () => {
    const imageAttachment: Message['attachments'] = [
      {
        id: 'a',
        kind: 'image',
        name: 'photo.png',
        mimeType: 'image/png',
        sizeBytes: 1,
        payload: 'data:image/png;base64,AA=='
      }
    ]
    const messages = [
      user('u1', 'explain this image', imageAttachment),
      user('u2', 'What is the weather in Paris today?')
    ]
    expect(resolveWebSearchForChatTurn(settings, messages)).toBe(true)
  })

  it('skips when the latest user turn has attachments', () => {
    const messages = [
      user('u1', 'What is the weather in Paris today?'),
      user(
        'u2',
        'explain this image',
        [
          {
            id: 'a',
            kind: 'image',
            name: 'photo.png',
            mimeType: 'image/png',
            sizeBytes: 1,
            payload: 'data:image/png;base64,AA=='
          }
        ]
      )
    ]
    expect(resolveWebSearchForChatTurn(settings, messages)).toBe(false)
  })

  it('allows local web search with custom endpoint when intent matches', () => {
    const messages = [user('u1', 'What is the weather in Paris today?')]
    expect(resolveWebSearchForChatTurn({ webSearchEnabled: true }, messages)).toBe(true)
  })

  it('skips casual chat and local time when toggle is on', () => {
    expect(resolveWebSearchForChatTurn(settings, [user('u1', 'который час')])).toBe(false)
    expect(resolveWebSearchForChatTurn(settings, [user('u1', 'как у тебя дела')])).toBe(false)
    expect(resolveWebSearchForChatTurn(settings, [user('u1', 'hi there')])).toBe(false)
  })

  it('does not run when web search toggle is off', () => {
    const messages = [user('u1', 'What is the weather in Paris today?')]
    expect(resolveWebSearchForChatTurn({ webSearchEnabled: false }, messages)).toBe(false)
  })
})

describe('resolveWebSearchForStreamTurn', () => {
  it('blocks force-search when the latest user turn has attachments', () => {
    const apiMessages = [
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: 'search the web for Mars news' },
          { type: 'image_url' as const, image_url: { url: 'data:image/png;base64,abc' } }
        ]
      }
    ]
    const decision = resolveWebSearchForStreamTurn(
      { webSearch: false },
      apiMessages,
      'search the web for Mars news'
    )
    expect(decision.blockedByAttachments).toBe(true)
    expect(decision.forceWebSearch).toBe(false)
    expect(decision.webSearchForTurn).toBe(false)
  })

  it('allows force-search without attachments when toggle is off', () => {
    const apiMessages = [{ role: 'user' as const, content: 'search the web for Mars news' }]
    const decision = resolveWebSearchForStreamTurn(
      { webSearch: false },
      apiMessages,
      'search the web for Mars news'
    )
    expect(decision.forceWebSearch).toBe(true)
    expect(decision.webSearchForTurn).toBe(false)
  })
})
