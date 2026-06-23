import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import {
  areConversationTurnPropsEqual,
  type ConversationTurnRenderProps
} from './conversation-turn-render'

function msg(id: string, role: Message['role'], content = 'x'): Message {
  return { id, role, content, createdAt: 0 }
}

function baseProps(overrides: Partial<ConversationTurnRenderProps> = {}): ConversationTurnRenderProps {
  return {
    turn: {
      id: 'turn-1',
      user: msg('u1', 'user', 'question'),
      assistantMessages: [msg('a1', 'assistant', 'answer')]
    },
    turnIndex: 2,
    activeChatId: 'chat-1',
    editingUserMessageId: null,
    onEnterEdit: () => undefined,
    onExitEdit: () => undefined,
    onSubmitEdit: async () => ({ ok: true }),
    isLatestTurn: false,
    ...overrides
  }
}

describe('areConversationTurnPropsEqual', () => {
  it('re-renders when turnIndex changes after checkpoint delete', () => {
    const prev = baseProps({ turnIndex: 4 })
    const next = baseProps({ turnIndex: 3 })
    expect(areConversationTurnPropsEqual(prev, next)).toBe(false)
  })

  it('re-renders when sticky header mode changes', () => {
    const prev = baseProps({ userHeaderSticky: true })
    const next = baseProps({ userHeaderSticky: false })
    expect(areConversationTurnPropsEqual(prev, next)).toBe(false)
  })

  it('skips re-render for stable completed turns', () => {
    const prev = baseProps()
    const next = baseProps()
    expect(areConversationTurnPropsEqual(prev, next)).toBe(true)
  })

  it('always re-renders the latest turn', () => {
    const prev = baseProps({ isLatestTurn: true })
    const next = baseProps({ isLatestTurn: true })
    expect(areConversationTurnPropsEqual(prev, next)).toBe(false)
  })

  it('re-renders when attachment content changes without count change', () => {
    const attachment = {
      id: 'att-1',
      kind: 'text' as const,
      name: 'notes.txt',
      mimeType: 'text/plain',
      payload: 'v1',
      sizeBytes: 2
    }
    const prev = baseProps({
      turn: {
        id: 'turn-1',
        user: { ...msg('u1', 'user', 'question'), attachments: [attachment] },
        assistantMessages: [msg('a1', 'assistant', 'answer')]
      }
    })
    const next = baseProps({
      turn: {
        id: 'turn-1',
        user: {
          ...msg('u1', 'user', 'question'),
          attachments: [{ ...attachment, payload: 'v2' }]
        },
        assistantMessages: [msg('a1', 'assistant', 'answer')]
      }
    })
    expect(areConversationTurnPropsEqual(prev, next)).toBe(false)
  })

  it('re-renders when search source URLs change', () => {
    const prev = baseProps({
      turn: {
        id: 'turn-1',
        user: msg('u1', 'user', 'question'),
        assistantMessages: [
          {
            ...msg('a1', 'assistant', 'answer'),
            searchSources: [{ title: 'A', url: 'https://a.example' }]
          }
        ]
      }
    })
    const next = baseProps({
      turn: {
        id: 'turn-1',
        user: msg('u1', 'user', 'question'),
        assistantMessages: [
          {
            ...msg('a1', 'assistant', 'answer'),
            searchSources: [{ title: 'B', url: 'https://b.example' }]
          }
        ]
      }
    })
    expect(areConversationTurnPropsEqual(prev, next)).toBe(false)
  })
})
