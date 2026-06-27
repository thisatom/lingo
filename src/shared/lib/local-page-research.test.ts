import { afterEach, describe, expect, it, vi } from 'vitest'
import { enrichSearchResultsWithPageContent } from '@/shared/lib/local-page-research'
import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'

describe('enrichSearchResultsWithPageContent visiting progress', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports visiting URLs sequentially while enriching pages', async () => {
    const results: LocalWebSearchResult[] = [
      { title: 'A', url: 'https://a.example/page', snippet: 'short' },
      { title: 'B', url: 'https://b.example/page', snippet: 'short' },
      { title: 'C', url: 'https://c.example/page', snippet: 'short' },
      { title: 'D', url: 'https://d.example/page', snippet: 'short' }
    ]

    const visitingOrder: string[] = []
    let resolveFirstFetch: (() => void) | undefined
    const firstFetchGate = new Promise<void>((resolve) => {
      resolveFirstFetch = resolve
    })

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('r.jina.ai')) {
        return new Response('', { status: 404 })
      }
      if (url.includes('a.example')) {
        await firstFetchGate
        return new Response('# Page A\n\n'.padEnd(140, 'content '), {
          status: 200,
          headers: { 'content-type': 'text/plain' }
        })
      }
      if (url.includes('b.example')) {
        return new Response('# Page B\n\n'.padEnd(140, 'content '), {
          status: 200,
          headers: { 'content-type': 'text/plain' }
        })
      }
      if (url.includes('c.example')) {
        return new Response('# Page C\n\n'.padEnd(140, 'content '), {
          status: 200,
          headers: { 'content-type': 'text/plain' }
        })
      }
      return new Response('', { status: 404 })
    })

    vi.stubGlobal('fetch', fetchMock)

    const enrichPromise = enrichSearchResultsWithPageContent(results, {
      onVisitingUrl: (url) => visitingOrder.push(url)
    })

    await Promise.resolve()
    expect(visitingOrder).toEqual(['https://a.example/page'])
    resolveFirstFetch?.()
    await enrichPromise

    expect(visitingOrder).toEqual([
      'https://a.example/page',
      'https://b.example/page',
      'https://c.example/page'
    ])
  })
})
