import { describe, expect, it } from 'vitest'
import { getChatPreviewSnippet } from '@/features/chat-preview/lib/chat-preview-snippet'

describe('getChatPreviewSnippet', () => {
  it('returns the latest user or assistant message', () => {
    const snippet = getChatPreviewSnippet({
      id: '1',
      title: 'Test',
      messages: [
        { id: 'a', role: 'user', content: 'Hello', createdAt: 1 },
        { id: 'b', role: 'assistant', content: 'Hi there', createdAt: 2 }
      ],
      createdAt: 1,
      updatedAt: 2
    })

    expect(snippet).toBe('Hi there')
  })

  it('skips thinking messages', () => {
    const snippet = getChatPreviewSnippet({
      id: '1',
      title: 'Test',
      messages: [
        { id: 'a', role: 'user', content: 'Question', createdAt: 1 },
        { id: 'b', role: 'thinking', content: 'internal', createdAt: 2 },
        { id: 'c', role: 'assistant', content: 'Answer', createdAt: 3 }
      ],
      createdAt: 1,
      updatedAt: 3
    })

    expect(snippet).toBe('Answer')
  })
})
