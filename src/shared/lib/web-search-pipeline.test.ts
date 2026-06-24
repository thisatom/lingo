import { describe, expect, it } from 'vitest'
import {
  assessWebSearchQuality,
  dedupeWebSearchResults,
  normalizeWebSearchResults,
  shouldTryExternalWebSearch
} from '@/shared/lib/web-search-pipeline'

describe('assessWebSearchQuality', () => {
  it('marks empty lists as empty', () => {
    expect(assessWebSearchQuality([])).toBe('empty')
  })

  it('marks rich snippets as good', () => {
    expect(
      assessWebSearchQuality([
        { title: 'A', url: 'https://a.test', snippet: 'x'.repeat(240) },
        { title: 'B', url: 'https://b.test', snippet: 'y'.repeat(240) }
      ])
    ).toBe('good')
  })

  it('marks weak single hits as thin', () => {
    expect(
      assessWebSearchQuality([{ title: 'A', url: 'https://a.test', snippet: 'short' }])
    ).toBe('thin')
  })
})

describe('normalizeWebSearchResults', () => {
  it('dedupes by url and prefers richer snippets', () => {
    const normalized = normalizeWebSearchResults([
      { title: 'Low', url: 'https://dup.test', snippet: 'tiny' },
      { title: 'High', url: 'https://dup.test', snippet: 'x'.repeat(300) },
      { title: 'Other', url: 'https://other.test', snippet: 'ok' }
    ])

    expect(normalized).toHaveLength(2)
    expect(normalized[0]?.title).toBe('High')
  })
})

describe('shouldTryExternalWebSearch', () => {
  it('requests external search when local failed', () => {
    expect(shouldTryExternalWebSearch([], true)).toBe(true)
  })

  it('skips external search when local hits are usable', () => {
    expect(
      shouldTryExternalWebSearch(
        [
          { title: 'A', url: 'https://a.test', snippet: 'x'.repeat(240) },
          { title: 'B', url: 'https://b.test', snippet: 'y'.repeat(240) }
        ],
        false
      )
    ).toBe(false)
  })
})
