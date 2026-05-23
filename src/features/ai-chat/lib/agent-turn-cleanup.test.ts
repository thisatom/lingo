import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { useChatsStore } from '@/entities/chat/model/store'
import {
  agentTurnTailMessageId,
  findTurnTailRemoveId,
  hasPersistedAssistantTurn,
  removeAgentTurnTailUnlessPersisted
} from './agent-turn-cleanup'

function msg(id: string, role: Message['role'], content = 'x'): Message {
  return { id, role, content, createdAt: 0 }
}

describe('agent-turn-cleanup', () => {
  it('agentTurnTailMessageId prefers thinking (earlier in thread)', () => {
    expect(agentTurnTailMessageId('t1', 'a1')).toBe('t1')
    expect(agentTurnTailMessageId(null, 'a1')).toBe('a1')
  })

  it('findTurnTailRemoveId returns first thinking in turn when regenerating assistant', () => {
    const messages = [
      msg('u1', 'user', 'q'),
      msg('t1', 'thinking', 'reason'),
      msg('a1', 'assistant', 'answer')
    ]
    expect(findTurnTailRemoveId(messages, 'a1')).toBe('t1')
  })

  it('findTurnTailRemoveId returns thinking id when retrying after failed answer', () => {
    const messages = [msg('u1', 'user'), msg('t1', 'thinking', 'only reasoning')]
    expect(findTurnTailRemoveId(messages, 't1')).toBe('t1')
  })

  it('findTurnTailRemoveId returns assistant when no thinking in turn', () => {
    const messages = [msg('u1', 'user'), msg('a1', 'assistant')]
    expect(findTurnTailRemoveId(messages, 'a1')).toBe('a1')
  })

  it('hasPersistedAssistantTurn detects stored assistant content', () => {
    const chatId = 'c1'
    useChatsStore.setState({
      chats: [
        {
          id: chatId,
          title: 'T',
          messages: [msg('u1', 'user'), msg('a1', 'assistant', 'done')],
          updatedAt: 0,
          createdAt: 0
        }
      ],
      activeChatId: chatId
    })
    expect(hasPersistedAssistantTurn(chatId, 'a1', '')).toBe(true)
  })

  it('removeAgentTurnTailUnlessPersisted keeps a completed answer', () => {
    const chatId = 'c1'
    useChatsStore.setState({
      chats: [
        {
          id: chatId,
          title: 'T',
          messages: [
            msg('u1', 'user'),
            msg('t1', 'thinking', ''),
            msg('a1', 'assistant', 'saved reply')
          ],
          updatedAt: 0,
          createdAt: 0
        }
      ],
      activeChatId: chatId
    })
    const removed: string[] = []
    removeAgentTurnTailUnlessPersisted(
      (id) => {
        removed.push(id)
      },
      chatId,
      't1',
      'a1',
      ''
    )
    expect(removed).toHaveLength(0)
    expect(useChatsStore.getState().chats[0]?.messages).toHaveLength(3)
  })
})
