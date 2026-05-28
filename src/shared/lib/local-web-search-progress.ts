import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'

export type LocalWebSearchProgress = {
  /** Snippet list from the search API (before slow page fetches). */
  onInitialResults?: (results: LocalWebSearchResult[]) => void
  /** Currently fetching full page text for a hit. */
  onVisitingUrl?: (url: string) => void
  /** BCP 47 locale for time/date/weather APIs (renderer practice language). */
  locale?: string
}
