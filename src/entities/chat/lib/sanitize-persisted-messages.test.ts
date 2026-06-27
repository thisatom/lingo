import { describe, expect, it } from 'vitest'
import type { Chat } from '@/entities/chat/model/types'
import {
  sanitizePersistedChats,
  sanitizePersistedMessageContent
} from './sanitize-persisted-messages'

describe('sanitizePersistedMessageContent', () => {
  it('strips assistant leaks from stored assistant messages', () => {
    const raw = 'User Safety: safe undefined\n\nHello world.'
    const message = {
      id: 'a1',
      role: 'assistant' as const,
      content: raw,
      createdAt: 0
    }
    const cleaned = sanitizePersistedMessageContent(message)
    expect(cleaned.content.trim()).toBe('Hello world.')
    expect(cleaned).not.toBe(message)
  })

  it('leaves user messages unchanged', () => {
    const message = {
      id: 'u1',
      role: 'user' as const,
      content: 'User Safety: safe undefined',
      createdAt: 0
    }
    expect(sanitizePersistedMessageContent(message)).toBe(message)
  })
})

describe('sanitizePersistedChats', () => {
  it('returns the same array reference when nothing changed', () => {
    const chats: Chat[] = [
      {
        id: 'c1',
        title: 'T',
        messages: [{ id: 'u1', role: 'user', content: 'Hi', createdAt: 0 }],
        createdAt: 0,
        updatedAt: 0
      }
    ]
    expect(sanitizePersistedChats(chats)).toBe(chats)
  })
})
