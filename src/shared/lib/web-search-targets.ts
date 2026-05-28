import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'

export type WebSearchSource = {
  title: string
  url: string
}

export function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Drop provider placeholders and other non-page targets from UI lists. */
export function isBrowsableSearchTarget(target: WebSearchSource): boolean {
  const raw = target.url?.trim()
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) return false
  try {
    const host = new URL(raw).hostname.replace(/^www\./, '')
    if (host === 'github.com' && /websearch/i.test(raw)) return false
    if (host === 'openrouter.ai' && !raw.includes('/c/')) return false
  } catch {
    return false
  }
  return Boolean(target.title?.trim() || raw)
}

export function mapResultsToSearchTargets(
  results: LocalWebSearchResult[]
): WebSearchSource[] {
  const out: WebSearchSource[] = []
  const seen = new Set<string>()

  for (const result of results) {
    const url = result.url?.trim()
    if (!url) continue
    const title = result.title?.trim() || hostFromUrl(url)
    const target = { title, url }
    if (!isBrowsableSearchTarget(target)) continue
    const key = url.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(target)
  }

  return out
}
