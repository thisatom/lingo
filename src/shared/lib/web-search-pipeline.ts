import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'

export type WebSearchQuality = 'good' | 'thin' | 'empty'

export type WebSearchProvider = 'mcp' | 'crawler' | 'ddg' | 'openrouter' | 'none'

function scoreResult(result: LocalWebSearchResult): number {
  const pageLen = result.pageContent?.trim().length ?? 0
  const snippetLen = result.snippet.trim().length
  const hasUrl = Boolean(result.url.trim())

  if (pageLen > 200) return 3
  if (pageLen > 80 || snippetLen > 220) return 2
  if (snippetLen > 60 || hasUrl) return 1
  return 0
}

/** How useful local hits are before calling the LLM or an external provider. */
export function assessWebSearchQuality(
  results: readonly LocalWebSearchResult[]
): WebSearchQuality {
  if (results.length === 0) return 'empty'

  const scores = results.map(scoreResult)
  const strong = scores.filter((score) => score >= 2).length
  const usable = scores.filter((score) => score >= 1).length

  if (strong >= 2 || (strong >= 1 && usable >= 3)) return 'good'
  if (usable >= 1 || results.length >= 2) return 'thin'
  return 'empty'
}

export function dedupeWebSearchResults(
  results: readonly LocalWebSearchResult[]
): LocalWebSearchResult[] {
  const byKey = new Map<string, LocalWebSearchResult>()

  for (const result of results) {
    const key = (result.url.trim() || result.title.trim()).toLowerCase()
    if (!key) continue
    const existing = byKey.get(key)
    if (!existing || scoreResult(result) > scoreResult(existing)) {
      byKey.set(key, result)
    }
  }

  return [...byKey.values()]
}

export function rankWebSearchResults(
  results: readonly LocalWebSearchResult[]
): LocalWebSearchResult[] {
  return [...results].sort((a, b) => scoreResult(b) - scoreResult(a))
}

export function normalizeWebSearchResults(
  results: readonly LocalWebSearchResult[]
): LocalWebSearchResult[] {
  return rankWebSearchResults(dedupeWebSearchResults(results))
}

export function shouldTryExternalWebSearch(
  localResults: readonly LocalWebSearchResult[],
  localFailed: boolean
): boolean {
  if (localFailed) return true
  return assessWebSearchQuality(localResults) === 'empty'
}
