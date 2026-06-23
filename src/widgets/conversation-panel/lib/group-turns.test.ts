import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { isThinkingMessageLive, shouldShowThinkingInTurn } from './group-turns'

function thinking(id: string, content = ''): Message {
  return { id, role: 'thinking', content, createdAt: 0 }
}

function user(id: string): Message {
  return { id, role: 'user', content: 'q', createdAt: 0 }
}

function assistant(id: string, content = ''): Message {
  return { id, role: 'assistant', content, createdAt: 0 }
}

describe('isThinkingMessageLive', () => {
  it('stays live during search until the answer starts streaming', () => {
    const turn = {
      assistantMessages: [thinking('t1', 'plan…')]
    }
    expect(
      isThinkingMessageLive(turn, 't1', true, true, 'searching', false)
    ).toBe(true)
    expect(
      isThinkingMessageLive(turn, 't1', true, true, 'thinking', false)
    ).toBe(true)
    expect(
      isThinkingMessageLive(turn, 't1', true, true, 'searching', true)
    ).toBe(false)
  })

  it('is not live once an assistant answer exists in the turn', () => {
    const turn = {
      assistantMessages: [thinking('t1', 'plan…'), assistant('a1', 'Hi')]
    }
    expect(
      isThinkingMessageLive(turn, 't1', true, true, 'thinking', false)
    ).toBe(false)
  })
})

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
