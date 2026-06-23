import { describe, expect, it } from 'vitest'
import {
  isLocalWebSearchFailure,
  LocalWebSearchError,
  SEARCH_FALLBACK_NOTICE
} from './local-web-search-errors'

describe('local-web-search-errors', () => {
  it('recognizes LocalWebSearchError', () => {
    expect(isLocalWebSearchFailure(new LocalWebSearchError('x', 'fetch'))).toBe(true)
  })

  it('recognizes abort errors', () => {
    expect(isLocalWebSearchFailure(new DOMException('aborted', 'AbortError'))).toBe(true)
  })

  it('ignores generic errors', () => {
    expect(isLocalWebSearchFailure(new Error('network'))).toBe(false)
  })

  it('exports fallback notice copy', () => {
    expect(SEARCH_FALLBACK_NOTICE).toMatch(/web search/i)
  })
})
