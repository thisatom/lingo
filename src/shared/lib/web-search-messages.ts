import type { ChatContentPart, ChatMessagePayload } from '@/shared/types/ipc'
import { isOpenRouterCreditError } from '@/shared/lib/openrouter-errors'
import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'
import type { LocalWebSearchProgress } from '@/shared/lib/local-web-search-progress'
import {
  isLocalWebSearchRegistered,
  searchWebLocal
} from '@/shared/lib/local-web-search-runtime'
function formatResultBody(result: LocalWebSearchResult): string {
  const fromPage = result.pageContent?.trim()
  if (fromPage) return fromPage
  return result.snippet.trim()
}

export function formatLocalWebSearchBlock(query: string, results: LocalWebSearchResult[]): string {
  if (results.length === 0) {
    return `**Web research (local):** No results found for "${query}". Answer from your knowledge and say if information may be outdated.`
  }

  const lines = results
    .map((result) => {
      const body = formatResultBody(result)
      if (!body) return null
      const title = result.title.trim() || 'Source'
      return `### ${title}\n${body}`
    })
    .filter((line): line is string => line != null)

  if (lines.length === 0) {
    return `**Web research (local):** No readable page content for "${query}". Answer from your knowledge.`
  }

  return [
    `**Web research** for "${query}" — page excerpts (not link lists):`,
    '',
    lines.join('\n\n'),
    '',
    'Use the excerpts as factual context. Answer in your own words. Do not output a list of URLs or "sources:" links unless the user explicitly asks for sources.'
  ].join('\n')
}

function appendBlockToUserContent(
  content: string | ChatContentPart[],
  block: string
): string | ChatContentPart[] {
  if (typeof content === 'string') {
    const trimmed = content.trim()
    return trimmed ? `${block}\n\n${trimmed}` : block
  }
  return [{ type: 'text', text: block }, ...content]
}

const MAX_LOCAL_SEARCH_CACHE = 16
const localSearchBlockCache = new Map<string, string>()

export async function fetchLocalWebSearchResults(
  query: string,
  progress?: LocalWebSearchProgress
): Promise<LocalWebSearchResult[]> {
  if (!isLocalWebSearchRegistered()) {
    throw new Error(
      'Local web search is not available in this environment. Use the desktop app or browser build with network access.'
    )
  }
  return searchWebLocal(query, progress)
}

export function substituteMessagesWithLocalWebSearchResults(
  messages: ChatMessagePayload[],
  query: string,
  results: LocalWebSearchResult[]
): ChatMessagePayload[] {
  const cacheKey = query.trim().toLowerCase()
  let block = localSearchBlockCache.get(cacheKey)
  if (!block) {
    block = formatLocalWebSearchBlock(query, results)
    localSearchBlockCache.set(cacheKey, block)
    if (localSearchBlockCache.size > MAX_LOCAL_SEARCH_CACHE) {
      const oldest = localSearchBlockCache.keys().next().value
      if (oldest) localSearchBlockCache.delete(oldest)
    }
  }
  const out = [...messages]

  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i].role !== 'user') continue
    out[i] = {
      ...out[i],
      content: appendBlockToUserContent(out[i].content, block)
    }
    break
  }

  return out
}

export async function substituteMessagesWithLocalWebSearch(
  messages: ChatMessagePayload[],
  query: string
): Promise<ChatMessagePayload[]> {
  const results = await fetchLocalWebSearchResults(query)
  return substituteMessagesWithLocalWebSearchResults(messages, query, results)
}

export function isWebSearchApiError(message: string): boolean {
  const m = message.toLowerCase()
  if (isOpenRouterCreditError(message)) return true

  return (
    m.includes('plugin') ||
    m.includes('web search') ||
    m.includes('web plugin') ||
    m.includes('researcher') ||
    m.includes('browsing') ||
    (m.includes('does not support') && (m.includes('web') || m.includes('search') || m.includes('plugin'))) ||
    (m.includes('not support') && (m.includes('web') || m.includes('search'))) ||
    (m.includes('unsupported') && (m.includes('web') || m.includes('plugin'))) ||
    (m.includes('invalid') && m.includes('plugin')) ||
    (m.includes('no endpoints') && (m.includes('web') || m.includes('plugin') || m.includes('search'))) ||
    m.includes('incomplete answer')
  )
}

export function isWebSearchResultFailure(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('incomplete answer') ||
    m.includes('empty response') ||
    m.includes('too short')
  )
}
