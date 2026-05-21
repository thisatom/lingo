import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'
import { crawlViaWebsearchApi } from '@/shared/lib/websearch-crawler'
import { canSpawnWebsearchMcp } from '@/shared/lib/websearch-config'

const PRACTICE_TO_SEARCH_LANG: Record<string, string> = {
  en: 'en',
  ru: 'ru',
  de: 'de',
  fr: 'fr',
  es: 'es',
  it: 'it',
  pt: 'pt',
  ja: 'ja',
  zh: 'zh',
  ko: 'ko'
}

const PRACTICE_TO_REGION: Record<string, string> = {
  ru: 'ru',
  en: 'us',
  de: 'de',
  fr: 'fr',
  es: 'es'
}

export function resolveWebsearchLanguage(locale: string): string {
  const key = locale.split('-')[0]?.toLowerCase()
  return PRACTICE_TO_SEARCH_LANG[key] ?? 'en'
}

export function resolveWebsearchRegion(locale: string): string | undefined {
  const key = locale.split('-')[0]?.toLowerCase()
  return PRACTICE_TO_REGION[key]
}

/** Primary web search: websearch-mcp (Node) or crawler API (browser). */
export async function performWebsearchQuery(
  query: string,
  locale: string
): Promise<LocalWebSearchResult[]> {
  const language = resolveWebsearchLanguage(locale)
  const region = resolveWebsearchRegion(locale)
  const options = { language, region }

  if (canSpawnWebsearchMcp()) {
    const { searchViaWebsearchMcp } = await import('@/shared/lib/websearch-mcp-client')
    return searchViaWebsearchMcp(query, options)
  }

  return crawlViaWebsearchApi(query, options)
}
