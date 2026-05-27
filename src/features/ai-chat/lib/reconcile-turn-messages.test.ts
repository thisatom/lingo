import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { reconcileTurnMessagesFromStore } from './reconcile-turn-messages'

const msg = (id: string, role: Message['role'], content: string): Message => ({
  id,
  role,
  content,
  createdAt: 0
})

describe('reconcileTurnMessagesFromStore', () => {
  it('recovers assistant id and text when only store has the message', () => {
    const messages = [
      msg('u1', 'user', 'Hi'),
      msg('t1', 'thinking', 'Reasoning'),
      msg('a1', 'assistant', 'Answer text')
    ]

    const result = reconcileTurnMessagesFromStore(messages, 't1', null, '', '')

    expect(result.assistantMessageId).toBe('a1')
    expect(result.finalText).toBe('Answer text')
    expect(result.finalThinkingText).toBe('Reasoning')
  })
})
