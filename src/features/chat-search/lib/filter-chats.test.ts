import { describe, expect, it } from 'vitest'
import { filterChatsByQuery } from '@/features/chat-search/lib/filter-chats'

describe('filterChatsByQuery', () => {
  const chats = [
    {
      id: 'chat-1',
      title: 'Spanish practice',
      pinned: false,
      updatedAt: 0,
      createdAt: 0,
      messages: [
        {
          id: 'm1',
          role: 'user' as const,
          content: 'How do I order coffee in Madrid?',
          createdAt: 0
        }
      ]
    },
    {
      id: 'chat-2',
      title: 'Travel tips',
      pinned: false,
      updatedAt: 0,
      createdAt: 0,
      messages: [
        {
          id: 'm2',
          role: 'assistant' as const,
          content: 'Pack light for the Alps',
          createdAt: 0
        }
      ]
    }
  ]

  it('returns all chats when query is empty', () => {
    expect(filterChatsByQuery(chats, '')).toHaveLength(2)
  })

  it('filters by title', () => {
    expect(filterChatsByQuery(chats, 'spanish')).toEqual([chats[0]])
  })

  it('filters by user message content', () => {
    expect(filterChatsByQuery(chats, 'madrid')).toEqual([chats[0]])
  })

  it('filters by assistant message content', () => {
    expect(filterChatsByQuery(chats, 'alps')).toEqual([chats[1]])
  })
})
