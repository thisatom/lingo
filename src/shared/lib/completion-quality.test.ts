import { describe, expect, it } from 'vitest'
import {
  looksCutOffMidSentence,
  mergeContinuationAnswer,
  shouldRetryIncompleteCompletion
} from './completion-quality'

describe('looksCutOffMidSentence', () => {
  it('flags unclosed code fences and abrupt clause endings', () => {
    expect(looksCutOffMidSentence('```ts\nconst x = 1')).toBe(true)
    expect(looksCutOffMidSentence(`${'word '.repeat(30)},`)).toBe(true)
  })

  it('does not flag long prose without terminal punctuation alone', () => {
    const prose = 'a'.repeat(150)
    expect(looksCutOffMidSentence(prose)).toBe(true)
    expect(looksCutOffMidSentence(`${prose}.`)).toBe(false)
  })

  it('flags Russian answers cut off after an em dash', () => {
    const cut =
      'Похоже, вы просто делитесь своими мыслями. Если вам нужна помощь с чем-то конкретным — будь то вопрос, задача или просто разговор — дайте'
    expect(looksCutOffMidSentence(cut)).toBe(true)
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

  it('does not retry long unpunctuated answers without stronger cut signals', () => {
    const cut = 'a'.repeat(150)
    expect(
      shouldRetryIncompleteCompletion({
        answer: cut,
        finishReason: 'stop',
        userMessage: 'hello'
      })
    ).toBe(true)
  })

  it('retries cut-off answers for custom backends when finish_reason is stop', () => {
    expect(
      shouldRetryIncompleteCompletion({
        answer: `${'word '.repeat(30)},`,
        finishReason: 'stop',
        userMessage: 'hello',
        customBackend: true
      })
    ).toBe(true)
  })

  it('retries long unpunctuated answers for custom backends when cut off', () => {
    const cut = 'a'.repeat(150)
    expect(
      shouldRetryIncompleteCompletion({
        answer: cut,
        finishReason: 'stop',
        userMessage: 'hi',
        customBackend: true
      })
    ).toBe(true)
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
  it('inserts a word boundary when continuation continues alphanumeric text', () => {
    expect(mergeContinuationAnswer('part one', 'part two')).toBe('part one part two')
  })

  it('preserves an explicit leading space in the continuation chunk', () => {
    expect(mergeContinuationAnswer('Short', ' complete answer.')).toBe('Short complete answer.')
  })

  it('keeps hyphenated continuations attached', () => {
    expect(mergeContinuationAnswer('multi-', 'part word')).toBe('multi-part word')
  })
})
