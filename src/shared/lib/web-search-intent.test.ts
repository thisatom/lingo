import { describe, expect, it } from 'vitest'
import {
  buildWebSearchQuery,
  isSubstantiveReply,
  looksTruncatedOrRefusal,
  optimizeWebSearchQuery,
  shouldForceWebSearch,
  shouldRetryWebSearchAnswer,
  shouldRunWebSearchForTurn
} from './web-search-intent'

describe('optimizeWebSearchQuery', () => {
  it('strips conversational phrasing while keeping factual terms', () => {
    expect(
      optimizeWebSearchQuery('Can you tell me what the weather in Paris is today?')
    ).toBe('what the weather in Paris is today')
  })
})

describe('buildWebSearchQuery', () => {
  it('strips explicit search phrases from the lookup query', () => {
    expect(buildWebSearchQuery('search the web for latest Mars news')).toBe('latest Mars news')
    expect(buildWebSearchQuery('загугли в интернете погоду в Париже')).toBe('погоду в Париже')
  })

  it('falls back to the original message when stripping leaves nothing', () => {
    expect(buildWebSearchQuery('search the web')).toBe('search the web')
  })
})

describe('shouldForceWebSearch', () => {
  it('matches explicit search requests only', () => {
    expect(shouldForceWebSearch('search the web for X')).toBe(true)
    expect(shouldForceWebSearch('google search for X')).toBe(true)
    expect(shouldForceWebSearch('загугли в интернете')).toBe(true)
    expect(shouldForceWebSearch('google')).toBe(false)
    expect(shouldForceWebSearch('What is quantum computing?')).toBe(false)
    expect(shouldForceWebSearch('What is the weather in Paris today?')).toBe(false)
  })
})

describe('shouldRunWebSearchForTurn', () => {
  it('runs when web search toggle is on and message is non-empty', () => {
    expect(shouldRunWebSearchForTurn('What is the weather in Paris today?', true)).toBe(true)
    expect(shouldRunWebSearchForTurn('hi there', true)).toBe(true)
    expect(shouldRunWebSearchForTurn('как у тебя дела', true)).toBe(true)
  })

  it('does not run when toggle is off unless explicit search command', () => {
    expect(shouldRunWebSearchForTurn('What is quantum computing?', false)).toBe(false)
    expect(shouldRunWebSearchForTurn('hi there', false)).toBe(false)
    expect(shouldRunWebSearchForTurn('search the web for X', false)).toBe(true)
  })

  it('skips empty messages', () => {
    expect(shouldRunWebSearchForTurn('   ', true)).toBe(false)
  })
})

describe('looksTruncatedOrRefusal', () => {
  it('does not flag complete short factual lines', () => {
    expect(looksTruncatedOrRefusal('Сейчас в Москве: 03:14:32.')).toBe(false)
  })

  it('flags cut-off mid-word lines', () => {
    expect(looksTruncatedOrRefusal('Сейчас в Москве 03:14:32 (т')).toBe(true)
  })
})

describe('shouldRetryWebSearchAnswer', () => {
  it('retries on length finish', () => {
    expect(shouldRetryWebSearchAnswer('short', 'anything', 'length')).toBe(true)
  })

  it('does not retry complete short replies to short prompts', () => {
    expect(shouldRetryWebSearchAnswer('Привет! У меня всё хорошо.', 'как дела?', null)).toBe(false)
  })
})

describe('isSubstantiveReply', () => {
  it('accepts normal greeting replies', () => {
    expect(isSubstantiveReply('Привет! У меня всё хорошо.', 'как у тебя дела')).toBe(true)
  })
})
