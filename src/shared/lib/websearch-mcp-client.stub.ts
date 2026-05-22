import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'

/** Renderer bundle stub — MCP runs only in Node/Electron main. */
export async function searchViaWebsearchMcp(
  _query: string,
  _options?: { language?: string; region?: string }
): Promise<LocalWebSearchResult[]> {
  return []
}
