import { describe, expect, it } from 'vitest'
import {
  looksCutOffMidSentence,
  mergeContinuationAnswer,
  shouldRetryIncompleteCompletion
} from './completion-quality'

describe('looksCutOffMidSentence', () => {
  it('flags long replies without terminal punctuation', () => {
    const cut = 'a'.repeat(150)
    expect(looksCutOffMidSentence(cut)).toBe(true)
    expect(looksCutOffMidSentence(`${cut}.`)).toBe(false)
  })
})

describe('shouldRetryIncompleteCompletion', () => {
  it('retries when finish_reason is length', () => {
    expect(
      shouldRetryIncompleteCompletion({
        answer: 'x'.repeat(200),
        finishReason: 'length',
        userMessage: 'hello'
      })
    ).toBe(true)
  })

  it('does not require substantive reply in practice mode', () => {
    expect(
      shouldRetryIncompleteCompletion({
        answer: 'Hello there, friend.',
        finishReason: 'stop',
        userMessage: 'hi',
        requireSubstantive: false
      })
    ).toBe(false)
  })

  it('skips heuristic retry for custom backends (only length)', () => {
    const cut = 'a'.repeat(150)
    expect(
      shouldRetryIncompleteCompletion({
        answer: cut,
        finishReason: 'stop',
        userMessage: 'hi',
        customBackend: true
      })
    ).toBe(false)
    expect(
      shouldRetryIncompleteCompletion({
        answer: cut,
        finishReason: 'length',
        userMessage: 'hi',
        customBackend: true
      })
    ).toBe(true)
  })
})

describe('mergeContinuationAnswer', () => {
  it('concatenates prefix and continuation', () => {
    expect(mergeContinuationAnswer('part one', 'part two')).toBe('part onepart two')
  })
})
