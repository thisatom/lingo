import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { groupMessagesIntoTurns } from '@/widgets/conversation-panel/lib/group-turns'

function user(id: string, content: string): Message {
  return { id, role: 'user', content, createdAt: 0 }
}

function assistant(id: string, content: string): Message {
  return { id, role: 'assistant', content, createdAt: 0 }
}

/** Virtualizer getItemKey contract: stable user ids survive checkpoint edits. */
describe('virtualizer turn keys after checkpoint edit', () => {
  it('keeps turn ids aligned with user message ids when tail turns are removed', () => {
    const before = groupMessagesIntoTurns([
      user('u1', 'first'),
      assistant('a1', 'reply 1'),
      user('u2', 'second'),
      assistant('a2', 'reply 2'),
      user('u3', 'third'),
      assistant('a3', 'reply 3')
    ])

    const after = groupMessagesIntoTurns([
      user('u1', 'first'),
      assistant('a1', 'reply 1'),
      user('u2', 'second edited'),
      assistant('a2', 'reply 2 revised')
    ])

    expect(before.map((turn) => turn.id)).toEqual(['u1', 'u2', 'u3'])
    expect(after.map((turn) => turn.id)).toEqual(['u1', 'u2'])
    expect(after.map((turn, index) => turn.id)).toEqual(
      after.map((turn) => turn.user.id)
    )
    expect(new Set(after.map((turn) => turn.id)).size).toBe(after.length)
  })
})
