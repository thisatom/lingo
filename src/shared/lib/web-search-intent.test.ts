import { describe, expect, it } from 'vitest'
import {
  shouldRetryWebSearchAnswer,
  shouldRunWebSearch,
  shouldUseResearchMode
} from './web-search-intent'

describe('shouldRunWebSearch', () => {
  it('skips very short casual phrases', () => {
    expect(shouldRunWebSearch('hi')).toBe(false)
    expect(shouldRunWebSearch('ok thanks')).toBe(false)
  })

  it('runs for explicit search and factual questions', () => {
    expect(shouldRunWebSearch('search the web for X')).toBe(true)
    expect(shouldRunWebSearch('What year is it?')).toBe(true)
    expect(shouldRunWebSearch('Tell me about the history of Rome in detail')).toBe(true)
  })
})

describe('shouldRetryWebSearchAnswer', () => {
  it('does not retry casual short replies', () => {
    expect(shouldRetryWebSearchAnswer('yes', 'hi', null)).toBe(false)
  })

  it('retries on length finish for research queries', () => {
    expect(shouldRetryWebSearchAnswer('short', 'What is quantum computing?', 'length')).toBe(
      true
    )
  })
})

describe('shouldUseResearchMode', () => {
  it('still treats length >= 8 as research prompt mode', () => {
    expect(shouldUseResearchMode('hello there')).toBe(true)
  })
})
