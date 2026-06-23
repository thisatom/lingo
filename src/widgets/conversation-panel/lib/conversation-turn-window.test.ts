import { describe, expect, it } from 'vitest'
import {
  initialHiddenTurnCount,
  INITIAL_VISIBLE_TURNS,
  nextHiddenTurnCount,
  TURN_LOAD_STEP
} from './conversation-turn-window'

describe('conversation-turn-window', () => {
  it('shows all turns for short chats', () => {
    expect(initialHiddenTurnCount(10)).toBe(0)
    expect(initialHiddenTurnCount(INITIAL_VISIBLE_TURNS)).toBe(0)
  })

  it('hides leading turns beyond the initial window', () => {
    expect(initialHiddenTurnCount(INITIAL_VISIBLE_TURNS + 5)).toBe(5)
  })

  it('reveals older turns in steps', () => {
    expect(nextHiddenTurnCount(TURN_LOAD_STEP + 10)).toBe(10)
    expect(nextHiddenTurnCount(5)).toBe(0)
  })
})
