import { useSettingsStore } from '@/entities/settings/model/store'
import { detectLocalSearchIntent } from '@/shared/lib/local-search-intent'
import { enrichSearchResultsWithPageContent } from '@/shared/lib/local-page-research'
import { fetchLocalDate, fetchLocalTime } from '@/shared/lib/local-search-time'
import { fetchLocalWeather } from '@/shared/lib/local-search-weather'
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

function resolveSearchLocale(): string {
  const lang = useSettingsStore.getState().practiceLanguage ?? 'en'
  return (
    PRACTICE_LOCALE[lang] ??
    (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US')
  )
}

export type LocalWebSearchResult = {
  title: string
  url: string
  snippet: string
  /** Plain text extracted from the page (used in the prompt instead of links). */
  pageContent?: string
}

const MAX_RESULTS = 8
const FETCH_TIMEOUT_MS = 12_000
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
    if (out.length >= MAX_RESULTS) return
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
  return out.slice(0, MAX_RESULTS)
}

function parseDdgHtmlResults(html: string): LocalWebSearchResult[] {
  const out: LocalWebSearchResult[] = []
  const seen = new Set<string>()

  const blockRe =
    /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi

  let match: RegExpExecArray | null
  while ((match = blockRe.exec(html)) !== null && out.length < MAX_RESULTS) {
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
  while ((match = liteLinkRe.exec(html)) !== null && links.length < MAX_RESULTS) {
    let url = decodeHtmlEntities(match[1].trim())
    if (url.startsWith('//')) url = `https:${url}`
    const title = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, '').trim())
    if (title) links.push({ url, title })
  }

  const snippets: string[] = []
  while ((match = liteSnippetRe.exec(html)) !== null && snippets.length < MAX_RESULTS) {
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

  try {
    for (const item of await fetchDdgInstantAnswer(query)) {
      pushUnique(merged, seen, item)
      if (merged.length >= MAX_RESULTS) return merged
    }
  } catch {
    // continue
  }

  if (merged.length < 3) {
    try {
      for (const item of await fetchDdgLiteSearch(query)) {
        pushUnique(merged, seen, item)
        if (merged.length >= MAX_RESULTS) return merged
      }
    } catch {
      // continue
    }
  }

  if (merged.length < 3) {
    try {
      for (const item of await fetchDdgHtmlSearch(query)) {
        pushUnique(merged, seen, item)
        if (merged.length >= MAX_RESULTS) return merged
      }
    } catch {
      // return partial
    }
  }

  return merged.slice(0, MAX_RESULTS)
}

async function fetchGeneralWebSearch(query: string, locale: string): Promise<LocalWebSearchResult[]> {
  try {
    const mcpResults = await performWebsearchQuery(query, locale)
    if (mcpResults.length > 0) return mcpResults
  } catch {
    // fall back to DuckDuckGo
  }

  return fetchDdgWebSearch(query)
}

async function fetchSpecializedResults(
  query: string,
  locale: string
): Promise<LocalWebSearchResult[] | null> {
  const intent = detectLocalSearchIntent(query)

  switch (intent.type) {
    case 'weather':
      return fetchLocalWeather(intent.city)
    case 'time':
      return fetchLocalTime(intent.city, locale)
    case 'date':
      return fetchLocalDate(locale)
    default:
      return null
  }
}

async function finalizeResults(results: LocalWebSearchResult[]): Promise<LocalWebSearchResult[]> {
  if (results.length === 0) return results
  if (results.some((r) => r.pageContent && r.pageContent.trim().length > 80)) {
    return results
  }
  return enrichSearchResultsWithPageContent(results)
}

/** Local search: weather/time APIs + websearch-mcp + DuckDuckGo fallback. */
export async function performLocalWebSearch(query: string): Promise<LocalWebSearchResult[]> {
  const locale = resolveSearchLocale()

  const specialized = await fetchSpecializedResults(query, locale).catch(() => null)
  if (specialized?.length) {
    return specialized
  }

  return finalizeResults(await fetchGeneralWebSearch(query, locale))
}
