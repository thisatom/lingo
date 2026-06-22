import { describe, expect, it } from 'vitest'
import {
  isSubstantiveReply,
  looksTruncatedOrRefusal,
  shouldForceWebSearch,
  shouldRetryWebSearchAnswer
} from './web-search-intent'

describe('shouldForceWebSearch', () => {
  it('matches explicit search requests only', () => {
    expect(shouldForceWebSearch('search the web for X')).toBe(true)
    expect(shouldForceWebSearch('загугли в интернете')).toBe(true)
    expect(shouldForceWebSearch('как у тебя дела')).toBe(false)
    expect(shouldForceWebSearch('который час')).toBe(false)
    expect(shouldForceWebSearch('What is quantum computing?')).toBe(false)
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
