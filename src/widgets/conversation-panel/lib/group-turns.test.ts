import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { groupMessagesIntoTurns, isThinkingMessageLive, voiceCaptureLabelForUserMessage } from './group-turns'
function msg(id: string, role: Message['role']): Message {
  return { id, role, content: 'x', createdAt: 0 }
}

describe('isThinkingMessageLive', () => {
  const turn = {
    assistantMessages: [msg('t1', 'thinking'), msg('a1', 'assistant')]
  }

  it('is false once an assistant answer exists after thinking', () => {
    expect(isThinkingMessageLive(turn, 't1', true, true, 'thinking')).toBe(false)
  })

  it('is true while only thinking is streaming on the latest turn', () => {
    const liveTurn = { assistantMessages: [msg('t1', 'thinking')] }
    expect(isThinkingMessageLive(liveTurn, 't1', true, true, 'thinking')).toBe(true)
  })

  it('stays live during speaking until the answer stream starts', () => {
    const liveTurn = { assistantMessages: [msg('t1', 'thinking')] }
    expect(isThinkingMessageLive(liveTurn, 't1', true, true, 'speaking', false)).toBe(true)
    expect(isThinkingMessageLive(liveTurn, 't1', true, true, 'speaking', true)).toBe(false)
  })

  it('is false during web search even with empty thinking placeholder', () => {
    const liveTurn = { assistantMessages: [msg('t1', 'thinking')] }
    expect(isThinkingMessageLive(liveTurn, 't1', true, true, 'searching')).toBe(false)
  })
})

describe('groupMessagesIntoTurns', () => {
  it('keeps an empty user turn while live voice capture is active', () => {
    const user: Message = { id: 'u1', role: 'user', content: '', createdAt: 0 }
    const turns = groupMessagesIntoTurns([user], { preserveEmptyUserMessageId: 'u1' })
    expect(turns).toHaveLength(1)
    expect(turns[0]?.user.id).toBe('u1')
  })

  it('drops empty user turns without a preserve id', () => {
    const user: Message = { id: 'u1', role: 'user', content: '', createdAt: 0 }
    expect(groupMessagesIntoTurns([user])).toHaveLength(0)
  })
})

describe('voiceCaptureLabelForUserMessage', () => {
  it('shows listening while the live voice bubble is empty before mic stage', () => {
    expect(voiceCaptureLabelForUserMessage('u1', '', 'u1', 'idle')).toBe('listening')
  })

  it('shows transcribing when stage is transcribing', () => {
    expect(voiceCaptureLabelForUserMessage('u1', '', 'u1', 'transcribing')).toBe('transcribing')
  })

  it('hides label once user content exists', () => {
    expect(voiceCaptureLabelForUserMessage('u1', 'hello', 'u1', 'listening')).toBeNull()
  })
})