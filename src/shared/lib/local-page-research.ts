import { extractMarkdownFromHtml } from '@/shared/lib/html-to-markdown'
import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'
import type { LocalWebSearchProgress } from '@/shared/lib/local-web-search-progress'

const MAX_PAGES_TO_FETCH = 3
const MAX_HTML_BYTES = 280_000
const PAGE_FETCH_TIMEOUT_MS = 9_000
const MAX_CONTENT_PER_PAGE = 4200
const MIN_USABLE_MARKDOWN = 120
const SEARCH_USER_AGENT =
  'Mozilla/5.0 (compatible; Lingo/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const SKIP_HOST_SUFFIXES = ['duckduckgo.com', 'open-meteo.com', 'wttr.in']

const SKIP_PATH_EXT = /\.(pdf|zip|rar|7z|exe|dmg|mp4|mp3|avi|mkv)(\?|$)/i

type JinaReaderPayload = {
  title?: string
  url?: string
  content?: string
  data?: {
    title?: string
    url?: string
    content?: string
  }
}

function fetchSignal(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs)
  if (!signal) return timeout
  return AbortSignal.any([signal, timeout])
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }
}

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

function clipPageMarkdown(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length <= MAX_CONTENT_PER_PAGE) return trimmed
  return `${trimmed.slice(0, MAX_CONTENT_PER_PAGE).trim()}\n\n…`
}

function parseJinaReaderPayload(raw: string): string | null {
  try {
    const json = JSON.parse(raw) as JinaReaderPayload
    const content = json.data?.content?.trim() ?? json.content?.trim()
    if (content && content.length >= 80) return clipPageMarkdown(content)
  } catch {
    // plain markdown fallback
  }

  const plain = raw.trim()
  if (plain.length >= 80) return clipPageMarkdown(plain)
  return null
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

  const pageLen = result.pageContent?.trim().length ?? 0
  if (pageLen >= MIN_USABLE_MARKDOWN) return false

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

/** Jina Reader — returns article Markdown (LLM-ready). */
async function fetchViaJinaReader(url: string, signal?: AbortSignal): Promise<string | null> {
  const readerUrl = `https://r.jina.ai/${url}`
  try {
    const response = await fetch(readerUrl, {
      headers: {
        Accept: 'application/json',
        'X-Respond-With': 'markdown',
        'User-Agent': SEARCH_USER_AGENT
      },
      signal: fetchSignal(signal, PAGE_FETCH_TIMEOUT_MS)
    })
    if (!response.ok) return null
    const raw = await response.text()
    return parseJinaReaderPayload(raw)
  } catch {
    return null
  }
}

async function fetchDirectPageMarkdown(url: string, signal?: AbortSignal): Promise<string | null> {
  throwIfAborted(signal)
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
        'User-Agent': SEARCH_USER_AGENT
      },
      redirect: 'follow',
      signal: fetchSignal(signal, PAGE_FETCH_TIMEOUT_MS)
    })

    if (!response.ok) return null

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
    if (contentType.includes('text/plain') && !contentType.includes('html')) {
      const plain = (await response.text()).trim()
      return plain.length >= MIN_USABLE_MARKDOWN ? clipPageMarkdown(plain) : null
    }

    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return null
    }

    const html = await readHtmlLimited(response)
    const markdown = await extractMarkdownFromHtml(html, MAX_CONTENT_PER_PAGE, url)
    return markdown.length >= MIN_USABLE_MARKDOWN ? markdown : null
  } catch {
    return null
  }
}

async function fetchPageContent(url: string, signal?: AbortSignal): Promise<string | null> {
  throwIfAborted(signal)

  const fromJina = await fetchViaJinaReader(url, signal)
  if (fromJina && fromJina.length >= MIN_USABLE_MARKDOWN) return fromJina

  const fromHtml = await fetchDirectPageMarkdown(url, signal)
  if (fromHtml && fromHtml.length >= MIN_USABLE_MARKDOWN) return fromHtml

  return fromJina ?? fromHtml
}

/** Fetches top hits; fills `pageContent` with Markdown excerpts for the LLM prompt. */
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

  const signal = progress?.signal

  const out = [...results]
  for (const { index, url } of candidates) {
    throwIfAborted(signal)
    progress?.onVisitingUrl?.(url)
    const pageContent = await fetchPageContent(url, signal)
    if (!pageContent) continue
    out[index] = {
      ...out[index],
      pageContent
    }
  }

  return out
}
