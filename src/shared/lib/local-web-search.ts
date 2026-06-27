import { isPracticeLanguageAuto, resolvePracticeLanguage } from '@/shared/config/practice-languages'
import { useSettingsStore } from '@/entities/settings/model/store'
import { enrichSearchResultsWithPageContent } from '@/shared/lib/local-page-research'
import { LocalWebSearchError } from '@/shared/lib/local-web-search-errors'
import type { LocalWebSearchProgress } from '@/shared/lib/local-web-search-progress'
import { normalizeWebSearchResults } from '@/shared/lib/web-search-pipeline'
import { getWebsearchMaxResults } from '@/shared/lib/websearch-config'
import { performWebsearchQuery } from '@/shared/lib/websearch-query'

const PRACTICE_LOCALE: Record<string, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  pt: 'pt-PT',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ko: 'ko-KR'
}

export function localeForPracticeLanguage(practiceLanguage?: string): string | undefined {
  const lang = practiceLanguage?.trim()
  if (!lang || isPracticeLanguageAuto(lang)) return undefined
  return PRACTICE_LOCALE[lang.split('-')[0]?.toLowerCase() ?? '']
}

function resolveSearchLocale(localeOverride?: string): string {
  const trimmed = localeOverride?.trim()
  if (trimmed) return trimmed
  try {
    const stored = useSettingsStore.getState().practiceLanguage ?? 'en'
    const lang = resolvePracticeLanguage(stored)
    const fromStore = PRACTICE_LOCALE[lang]
    if (fromStore) return fromStore
  } catch {
    // settings store unavailable (e.g. Electron main)
  }
  return typeof navigator !== 'undefined' && navigator.language
    ? navigator.language
    : 'en-US'
}

export type LocalWebSearchResult = {
  title: string
  url: string
  snippet: string
  /** Markdown excerpt from the page (Readability/Turndown or Jina Reader). */
  pageContent?: string
}

const FETCH_TIMEOUT_MS = 10_000
const PRIMARY_SEARCH_TIMEOUT_MS = 10_000

function maxResults(): number {
  return getWebsearchMaxResults()
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new LocalWebSearchError('Web search aborted', 'aborted')
  }
}

const SEARCH_USER_AGENT =
  'Mozilla/5.0 (compatible; Lingo/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
}

function pushUnique(
  out: LocalWebSearchResult[],
  seen: Set<string>,
  item: LocalWebSearchResult
): void {
  const key = item.url || item.title
  if (!key || seen.has(key)) return
  seen.add(key)
  out.push(item)
}

type DdgRelatedTopic = {
  Text?: string
  FirstURL?: string
  Topics?: DdgRelatedTopic[]
}

type DdgApiResponse = {
  Heading?: string
  Abstract?: string
  AbstractURL?: string
  RelatedTopics?: DdgRelatedTopic[]
}

function flattenDdgTopics(
  topics: DdgRelatedTopic[] | undefined,
  out: LocalWebSearchResult[],
  seen: Set<string>
): void {
  if (!topics?.length) return
  for (const topic of topics) {
    if (topic.Topics?.length) {
      flattenDdgTopics(topic.Topics, out, seen)
      continue
    }
    const text = topic.Text?.trim()
    if (!text) continue
    const dash = text.indexOf(' - ')
    const title = (dash >= 0 ? text.slice(0, dash) : text).trim()
    const snippet = (dash >= 0 ? text.slice(dash + 3) : text).trim()
    pushUnique(out, seen, {
      title: title || 'Result',
      url: topic.FirstURL?.trim() ?? '',
      snippet
    })
    if (out.length >= maxResults()) return
  }
}

async function fetchDdgInstantAnswer(query: string): Promise<LocalWebSearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&skip_disambig=1`
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': SEARCH_USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  })
  if (!response.ok) return []

  const data = (await response.json()) as DdgApiResponse
  const out: LocalWebSearchResult[] = []
  const seen = new Set<string>()

  if (data.Abstract?.trim()) {
    pushUnique(out, seen, {
      title: data.Heading?.trim() || 'Summary',
      url: data.AbstractURL?.trim() ?? '',
      snippet: data.Abstract.trim()
    })
  }

  flattenDdgTopics(data.RelatedTopics, out, seen)
  return out.slice(0, maxResults())
}

function parseDdgHtmlResults(html: string): LocalWebSearchResult[] {
  const out: LocalWebSearchResult[] = []
  const seen = new Set<string>()
  const limit = maxResults()

  const blockRe =
    /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi

  let match: RegExpExecArray | null
  while ((match = blockRe.exec(html)) !== null && out.length < limit) {
    const rawUrl = decodeHtmlEntities(match[1].trim())
    const title = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, '').trim())
    const snippet = decodeHtmlEntities(match[3].replace(/<[^>]+>/g, '').trim())
    if (!title) continue
    let url = rawUrl
    if (url.startsWith('//')) url = `https:${url}`
    pushUnique(out, seen, { title, url, snippet })
  }

  if (out.length > 0) return out

  const liteLinkRe =
    /<a[^>]+rel="nofollow"[^>]+class="result-link"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  const liteSnippetRe = /<td[^>]+class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi
  const links: Array<{ url: string; title: string }> = []
  while ((match = liteLinkRe.exec(html)) !== null && links.length < limit) {
    let url = decodeHtmlEntities(match[1].trim())
    if (url.startsWith('//')) url = `https:${url}`
    const title = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, '').trim())
    if (title) links.push({ url, title })
  }

  const snippets: string[] = []
  while ((match = liteSnippetRe.exec(html)) !== null && snippets.length < limit) {
    snippets.push(decodeHtmlEntities(match[1].replace(/<[^>]+>/g, '').trim()))
  }

  links.forEach((link, index) => {
    pushUnique(out, seen, {
      title: link.title,
      url: link.url,
      snippet: snippets[index] ?? ''
    })
  })

  return out
}

async function fetchDdgHtmlSearch(query: string): Promise<LocalWebSearchResult[]> {
  const body = new URLSearchParams({ q: query })
  const response = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': SEARCH_USER_AGENT,
      Accept: 'text/html'
    },
    body: body.toString(),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  })
  if (!response.ok) return []
  return parseDdgHtmlResults(await response.text())
}

async function fetchDdgLiteSearch(query: string): Promise<LocalWebSearchResult[]> {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`
  const response = await fetch(url, {
    headers: { 'User-Agent': SEARCH_USER_AGENT, Accept: 'text/html' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  })
  if (!response.ok) return []
  return parseDdgHtmlResults(await response.text())
}

async function fetchDdgWebSearch(query: string): Promise<LocalWebSearchResult[]> {
  const seen = new Set<string>()
  const merged: LocalWebSearchResult[] = []
  const limit = maxResults()

  const mergeBatch = (items: LocalWebSearchResult[]) => {
    for (const item of items) {
      pushUnique(merged, seen, item)
      if (merged.length >= limit) return
    }
  }

  const [instantSettled, liteSettled] = await Promise.allSettled([
    fetchDdgInstantAnswer(query),
    fetchDdgLiteSearch(query)
  ])

  if (instantSettled.status === 'fulfilled') mergeBatch(instantSettled.value)
  if (merged.length >= 4) return merged.slice(0, limit)
  if (liteSettled.status === 'fulfilled') mergeBatch(liteSettled.value)
  if (merged.length >= 3) return merged.slice(0, limit)

  try {
    mergeBatch(await fetchDdgHtmlSearch(query))
  } catch {
    // return partial
  }

  return merged.slice(0, limit)
}

async function fetchPrimaryWebSearch(
  query: string,
  locale: string,
  signal?: AbortSignal
): Promise<LocalWebSearchResult[]> {
  throwIfAborted(signal)

  const primary = performWebsearchQuery(query, locale)
  const timeout = new Promise<never>((_, reject) => {
    const timer = setTimeout(
      () => reject(new Error('primary search timeout')),
      PRIMARY_SEARCH_TIMEOUT_MS
    )
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new LocalWebSearchError('Web search aborted', 'aborted'))
      },
      { once: true }
    )
  })

  try {
    const mcpResults = await Promise.race([primary, timeout])
    if (mcpResults.length > 0) return mcpResults
  } catch (error) {
    if (error instanceof LocalWebSearchError && error.code === 'aborted') throw error
    // fall back to DuckDuckGo
  }

  throwIfAborted(signal)
  return fetchDdgWebSearch(query)
}

export function resultsNeedPageEnrichment(results: readonly LocalWebSearchResult[]): boolean {
  if (results.length === 0) return false

  const rich = results.filter((result) => {
    const pageLen = result.pageContent?.trim().length ?? 0
    const snippetLen = result.snippet.trim().length
    return pageLen > 80 || snippetLen >= 280
  })

  if (rich.length >= 2) return false
  if (results.every((result) => (result.pageContent?.trim().length ?? 0) > 120)) return false
  return true
}

async function finalizeResults(
  results: LocalWebSearchResult[],
  progress?: LocalWebSearchProgress
): Promise<LocalWebSearchResult[]> {
  throwIfAborted(progress?.signal)
  if (results.length === 0) return results
  if (!resultsNeedPageEnrichment(results)) return results
  return enrichSearchResultsWithPageContent(results, progress)
}

/** Local search: MCP/crawler first, DuckDuckGo fallback, optional page enrichment. */
export async function performLocalWebSearch(
  query: string,
  progress?: LocalWebSearchProgress
): Promise<LocalWebSearchResult[]> {
  throwIfAborted(progress?.signal)
  const locale = resolveSearchLocale(progress?.locale)

  let general: LocalWebSearchResult[]
  try {
    general = await fetchPrimaryWebSearch(query, locale, progress?.signal)
  } catch (error) {
    if (progress?.signal?.aborted || (error instanceof LocalWebSearchError && error.code === 'aborted')) {
      throw error
    }
    throw new LocalWebSearchError(
      error instanceof Error ? error.message : 'Web search failed',
      'network'
    )
  }

  general = normalizeWebSearchResults(general).slice(0, maxResults())

  throwIfAborted(progress?.signal)
  progress?.onInitialResults?.(general)
  return finalizeResults(general, progress)
}
