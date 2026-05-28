import { describe, expect, it } from 'vitest'
import { isBrowsableSearchTarget, mapResultsToSearchTargets } from './web-search-targets'

describe('web-search-targets', () => {
  it('filters provider placeholder links', () => {
    expect(
      isBrowsableSearchTarget({
        title: 'WebSearch MCP',
        url: 'https://github.com/mnhlt/WebSearch-MCP'
      })
    ).toBe(false)
    expect(
      isBrowsableSearchTarget({
        title: 'Example',
        url: 'https://example.com/article'
      })
    ).toBe(true)
  })

  it('maps crawl hits to unique browsable targets', () => {
    const targets = mapResultsToSearchTargets([
      { title: 'A', url: 'https://a.com', snippet: 'one' },
      { title: 'B', url: 'https://b.com', snippet: 'two' },
      { title: 'A dup', url: 'https://a.com', snippet: 'dup' }
    ])
    expect(targets).toHaveLength(2)
    expect(targets[0]?.url).toBe('https://a.com')
  })
})
