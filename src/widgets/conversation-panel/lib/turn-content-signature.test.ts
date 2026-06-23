import { describe, expect, it } from 'vitest'
import { buildTurnContentSignature, buildTurnsContentSignature } from './turn-content-signature'
import type { ConversationTurn } from './group-turns'

function turn(contentLen: number, assistantLen: number): ConversationTurn {
  return {
    id: 'turn-1',
    user: { id: 'u1', role: 'user', content: 'x'.repeat(contentLen), createdAt: 0 },
    assistantMessages: [
      { id: 'a1', role: 'assistant', content: 'y'.repeat(assistantLen), createdAt: 0 }
    ]
  }
}

describe('turn-content-signature', () => {
  it('changes when assistant content grows', () => {
    const before = buildTurnContentSignature(turn(4, 10))
    const after = buildTurnContentSignature(turn(4, 20))
    expect(before).not.toBe(after)
  })

  it('joins turn signatures for virtualizer remeasure', () => {
    expect(buildTurnsContentSignature([turn(1, 2), turn(3, 4)])).toContain('||')
  })
})
