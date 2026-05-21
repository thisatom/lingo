import { performLocalWebSearch } from '@/shared/lib/local-web-search'
import { registerLocalWebSearch } from '@/shared/lib/local-web-search-runtime'

/**
 * Registers local web search (websearch-mcp + crawler API, DuckDuckGo fallback).
 * Requires WebSearch Crawler at http://localhost:3001 — see docker-compose.websearch.yml
 */
export function setupLocalWebSearch(): void {
  registerLocalWebSearch(performLocalWebSearch)
}
