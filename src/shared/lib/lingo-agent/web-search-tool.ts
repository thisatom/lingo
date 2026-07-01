import { tool } from 'ai'
import { z } from 'zod'
import { WEB_SEARCH_TOOL_NAME } from '@/shared/lib/lingo-agent/web-search-constants'
import { performLocalWebSearch, type LocalWebSearchResult } from '@/shared/lib/local-web-search'
import { formatLocalWebSearchBlock } from '@/shared/lib/web-search-messages'

export { WEB_SEARCH_TOOL_NAME }

export type WebSearchToolCallbacks = {
  onInitialResults?: (results: LocalWebSearchResult[]) => void
  onVisitingUrl?: (url: string) => void
}

export type WebSearchToolContext = WebSearchToolCallbacks & {
  locale?: string
  signal?: AbortSignal
}

export type WebSearchToolResult = {
  query: string
  resultCount: number
  summary: string
}

/** AI SDK tool — wraps `performLocalWebSearch` for agent-driven research turns. */
export function createWebSearchTool(ctx: WebSearchToolContext) {
  return tool({
    description:
      'Search the web for up-to-date factual information. Call with a concise query derived from the user question.',
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe('Short search query in the user language or English')
    }),
    execute: async ({ query }): Promise<WebSearchToolResult> => {
      const results = await performLocalWebSearch(query, {
        locale: ctx.locale,
        signal: ctx.signal,
        onInitialResults: ctx.onInitialResults,
        onVisitingUrl: ctx.onVisitingUrl
      })

      return {
        query,
        resultCount: results.length,
        summary: formatLocalWebSearchBlock(query, results)
      }
    }
  })
}

export function webSearchTools(ctx: WebSearchToolContext) {
  return {
    [WEB_SEARCH_TOOL_NAME]: createWebSearchTool(ctx)
  } as const
}
