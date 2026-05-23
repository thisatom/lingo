import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { isThinkingMessageLive } from './group-turns'

function msg(id: string, role: Message['role']): Message {
  return { id, role, content: 'x', createdAt: 0 }
}

describe('isThinkingMessageLive', () => {
  const turn = {
    assistantMessages: [msg('t1', 'thinking'), msg('a1', 'assistant')]
  }

  it('is false once an assistant answer exists after thinking', () => {
    expect(isThinkingMessageLive(turn, 't1', true, true)).toBe(false)
  })

  it('is true while only thinking is streaming on the latest turn', () => {
    const liveTurn = { assistantMessages: [msg('t1', 'thinking')] }
    expect(isThinkingMessageLive(liveTurn, 't1', true, true)).toBe(true)
  })
})
