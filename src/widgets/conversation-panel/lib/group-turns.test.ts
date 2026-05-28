import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { shouldShowThinkingInTurn } from './group-turns'

function thinking(id: string, content = ''): Message {
  return { id, role: 'thinking', content, createdAt: 0 }
}

function user(id: string): Message {
  return { id, role: 'user', content: 'q', createdAt: 0 }
}

describe('shouldShowThinkingInTurn', () => {
  it('hides orphan thinking from a previous stopped turn', () => {
    const turn = {
      user: user('u1'),
      assistantMessages: [thinking('t1', 'reasoning…')]
    }
    expect(
      shouldShowThinkingInTurn(turn, turn.assistantMessages[0], 0, {
        agentBusy: true,
        isLatestTurn: true
      })
    ).toBe(true)

    expect(
      shouldShowThinkingInTurn(turn, turn.assistantMessages[0], 0, {
        agentBusy: false,
        isLatestTurn: false
      })
    ).toBe(false)
  })
})
