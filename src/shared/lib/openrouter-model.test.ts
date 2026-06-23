import { describe, expect, it } from 'vitest'
import {
  extractAssistantStreamDelta,
  extractAssistantText
} from './openrouter-model'

describe('extractAssistantStreamDelta', () => {
  it('returns raw chunk text without line-based leak stripping', () => {
    const partial = 'П\nривет'
    expect(extractAssistantStreamDelta({ content: partial })).toBe(partial)
    expect(extractAssistantText({ content: partial })).toBe(partial)
  })

  it('preserves role tags in stream deltas (stripped on cumulative/final pass)', () => {
    const chunk = '</assistant>Hello'
    expect(extractAssistantStreamDelta({ content: chunk })).toBe(chunk)
    expect(extractAssistantText({ content: chunk })).toBe('Hello')
  })

  it('joins text parts from structured content', () => {
    expect(
      extractAssistantStreamDelta({
        content: [
          { type: 'text', text: 'Hel' },
          { type: 'text', text: 'lo' }
        ]
      })
    ).toBe('Hello')
  })
})
