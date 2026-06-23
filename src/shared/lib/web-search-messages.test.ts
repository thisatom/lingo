import { describe, expect, it } from 'vitest'
import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'
import { substituteMessagesWithLocalWebSearchResults } from './web-search-messages'

function result(url: string, snippet: string): LocalWebSearchResult {
  return { title: 'Title', url, snippet }
}

describe('substituteMessagesWithLocalWebSearchResults', () => {
  it('uses different blocks when the same query returns different results', () => {
    const messages = [{ role: 'user' as const, content: 'What is Mars news?' }]

    const emptyTurn = substituteMessagesWithLocalWebSearchResults(
      messages,
      'Mars news',
      []
    )
    const richTurn = substituteMessagesWithLocalWebSearchResults(
      messages,
      'Mars news',
      [result('https://example.com', 'Latest rover update.')]
    )

    const emptyContent = emptyTurn[0]?.content
    const richContent = richTurn[0]?.content
    expect(typeof emptyContent).toBe('string')
    expect(typeof richContent).toBe('string')
    expect(emptyContent).not.toBe(richContent)
    expect(String(richContent)).toContain('Latest rover update.')
  })
})
