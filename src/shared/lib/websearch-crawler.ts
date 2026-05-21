import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'
import { getWebsearchApiUrl, getWebsearchMaxResults } from '@/shared/lib/websearch-config'

const CRAWL_TIMEOUT_MS = 45_000

export type WebsearchCrawlHit = {
  title: string
  excerpt?: string
  text?: string
  url: string
  siteName?: string
  byline?: string
}

type CrawlResponse = {
  query?: string
  results?: WebsearchCrawlHit[]
  error?: string
}

export function mapCrawlHitsToLocalResults(hits: WebsearchCrawlHit[]): LocalWebSearchResult[] {
  return hits.map((hit) => {
    const title = hit.title?.trim() || hit.siteName?.trim() || 'Source'
    const pageText = hit.text?.trim()
    const excerpt = hit.excerpt?.trim() ?? ''
    return {
      title: hit.siteName ? `${title} — ${hit.siteName}` : title,
      url: hit.url?.trim() ?? '',
      snippet: excerpt || (pageText ? pageText.slice(0, 280) : ''),
      pageContent: pageText && pageText.length > 80 ? pageText : undefined
    }
  })
}

/** Same HTTP API that the websearch-mcp server uses (WebSearch Crawler). */
export async function crawlViaWebsearchApi(
  query: string,
  options?: { language?: string; region?: string; numResults?: number }
): Promise<LocalWebSearchResult[]> {
  const apiUrl = getWebsearchApiUrl().replace(/\/$/, '')
  const payload = {
    query,
    numResults: options?.numResults ?? getWebsearchMaxResults(),
    language: options?.language,
    region: options?.region,
    filters: {
      resultType: 'all' as const
    }
  }

  const response = await fetch(`${apiUrl}/crawl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(CRAWL_TIMEOUT_MS)
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      text.trim() || `WebSearch crawler failed (${response.status}). Is the service running at ${apiUrl}?`
    )
  }

  const data = (await response.json()) as CrawlResponse
  if (data.error) throw new Error(data.error)

  const hits = data.results ?? []
  return mapCrawlHitsToLocalResults(hits)
}
