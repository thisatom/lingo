import { extractTextFromHtml } from '@/shared/lib/html-to-text'
import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'
import type { LocalWebSearchProgress } from '@/shared/lib/local-web-search-progress'

const MAX_PAGES_TO_FETCH = 2
const MAX_HTML_BYTES = 280_000
const PAGE_FETCH_TIMEOUT_MS = 7_000
const MAX_CONTENT_PER_PAGE = 3200
const SEARCH_USER_AGENT =
  'Mozilla/5.0 (compatible; Lingo/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const SKIP_HOST_SUFFIXES = ['duckduckgo.com', 'open-meteo.com', 'wttr.in']

const SKIP_PATH_EXT = /\.(pdf|zip|rar|7z|exe|dmg|mp4|mp3|avi|mkv)(\?|$)/i

function resolveResultUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    if (trimmed.startsWith('//')) {
      return new URL(`https:${trimmed}`).href
    }

    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

    if (url.hostname.includes('duckduckgo.com') && url.searchParams.has('uddg')) {
      const target = url.searchParams.get('uddg')
      if (target) return decodeURIComponent(target)
    }

    return url.href
  } catch {
    return null
  }
}

function shouldFetchPage(result: LocalWebSearchResult): boolean {
  const url = resolveResultUrl(result.url)
  if (!url) return false
  if (SKIP_PATH_EXT.test(url)) return false

  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (SKIP_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) {
      return false
    }
  } catch {
    return false
  }

  const snippet = result.snippet.trim()
  if (snippet.length >= 420) return false

  return true
}

async function readHtmlLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return (await response.text()).slice(0, MAX_HTML_BYTES)

  let html = ''
  let total = 0
  while (total < MAX_HTML_BYTES) {
    const { done, value } = await reader.read()
    if (done || !value) break
    total += value.length
    html += new TextDecoder().decode(value)
  }
  reader.cancel().catch(() => {})
  return html
}

async function fetchViaJinaReader(url: string): Promise<string | null> {
  const readerUrl = `https://r.jina.ai/${url}`
  try {
    const response = await fetch(readerUrl, {
      headers: {
        Accept: 'text/plain',
        'User-Agent': SEARCH_USER_AGENT
      },
      signal: AbortSignal.timeout(PAGE_FETCH_TIMEOUT_MS)
    })
    if (!response.ok) return null
    const text = (await response.text()).trim()
    if (text.length < 80) return null
    return text.length > MAX_CONTENT_PER_PAGE
      ? `${text.slice(0, MAX_CONTENT_PER_PAGE).trim()}…`
      : text
  } catch {
    return null
  }
}

async function fetchPageContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
        'User-Agent': SEARCH_USER_AGENT
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(PAGE_FETCH_TIMEOUT_MS)
    })

    if (!response.ok) return fetchViaJinaReader(url)

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
    if (contentType.includes('text/plain') && !contentType.includes('html')) {
      const plain = (await response.text()).trim()
      return plain.length > 60
        ? plain.slice(0, MAX_CONTENT_PER_PAGE)
        : fetchViaJinaReader(url)
    }

    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return fetchViaJinaReader(url)
    }

    const html = await readHtmlLimited(response)
    const extracted = extractTextFromHtml(html, MAX_CONTENT_PER_PAGE)
    if (extracted.length >= 120) return extracted

    return fetchViaJinaReader(url)
  } catch {
    return fetchViaJinaReader(url)
  }
}

/** Fetches and parses top search hits; fills `pageContent` (no links in the prompt). */
export async function enrichSearchResultsWithPageContent(
  results: LocalWebSearchResult[],
  progress?: LocalWebSearchProgress
): Promise<LocalWebSearchResult[]> {
  const candidates = results
    .map((result, index) => ({ result, index, url: resolveResultUrl(result.url) }))
    .filter((item): item is { result: LocalWebSearchResult; index: number; url: string } =>
      item.url != null && shouldFetchPage(item.result)
    )
    .slice(0, MAX_PAGES_TO_FETCH)

  if (candidates.length === 0) return results

  const fetched = await Promise.all(
    candidates.map(async ({ result, index, url }) => {
      progress?.onVisitingUrl?.(url)
      const pageContent = await fetchPageContent(url)
      return { index, pageContent, url }
    })
  )

  const out = [...results]
  for (const { index, pageContent } of fetched) {
    if (!pageContent) continue
    out[index] = {
      ...out[index],
      pageContent
    }
  }

  return out
}
