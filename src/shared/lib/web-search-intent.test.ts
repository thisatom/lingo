import { describe, expect, it } from 'vitest'
import {
  buildWebSearchQuery,
  isSubstantiveReply,
  looksTruncatedOrRefusal,
  optimizeWebSearchQuery,
  shouldForceWebSearch,
  shouldRetryWebSearchAnswer,
  shouldUseWebSearchForMessage
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
    expect(shouldForceWebSearch('как у тебя дела')).toBe(false)
    expect(shouldForceWebSearch('который час')).toBe(false)
    expect(shouldForceWebSearch('What is quantum computing?')).toBe(false)
  })
})

describe('shouldUseWebSearchForMessage', () => {
  it('allows factual questions when toggle permits search', () => {
    expect(shouldUseWebSearchForMessage('What is quantum computing in simple terms?')).toBe(true)
    expect(shouldUseWebSearchForMessage('What is the weather in Paris today?')).toBe(true)
  })

  it('skips small talk and local time/date', () => {
    expect(shouldUseWebSearchForMessage('как у тебя дела')).toBe(false)
    expect(shouldUseWebSearchForMessage('который час')).toBe(false)
    expect(shouldUseWebSearchForMessage('hi there')).toBe(false)
  })

  it('honors explicit search requests', () => {
    expect(shouldUseWebSearchForMessage('search the web for X')).toBe(true)
  })

  it('allows short factual wh-questions with enough context', () => {
    expect(shouldUseWebSearchForMessage('Who won the game?')).toBe(true)
    expect(shouldUseWebSearchForMessage('Why now?')).toBe(false)
    expect(shouldUseWebSearchForMessage('ok?')).toBe(false)
  })

  it('skips creative writing prompts', () => {
    expect(shouldUseWebSearchForMessage('Write me a poem about the sea')).toBe(false)
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
