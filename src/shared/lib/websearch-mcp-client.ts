import { createRequire } from 'node:module'
import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'
import { crawlViaWebsearchApi } from '@/shared/lib/websearch-crawler'
import {
  canSpawnWebsearchMcp,
  getWebsearchApiUrl,
  getWebsearchMaxResults
} from '@/shared/lib/websearch-config'

type McpWebSearchPayload = {
  query: string
  results: Array<{
    title: string
    snippet?: string
    text?: string
    url: string
    siteName?: string
    byline?: string
  }>
}

let clientTask: Promise<import('@modelcontextprotocol/sdk/client/index.js').Client> | null =
  null

function mcpEnv(): Record<string, string> {
  const base =
    typeof process !== 'undefined' && process.env
      ? { ...process.env }
      : ({} as Record<string, string>)
  return {
    ...base,
    API_URL: getWebsearchApiUrl(),
    MAX_SEARCH_RESULT: String(getWebsearchMaxResults())
  }
}

async function getMcpClient(): Promise<
  import('@modelcontextprotocol/sdk/client/index.js').Client
> {
  if (!clientTask) {
    clientTask = (async () => {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js')
      const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js')

      const require = createRequire(import.meta.url)
      const serverEntry = require.resolve('websearch-mcp/dist/index.js')

      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [serverEntry],
        env: mcpEnv(),
        stderr: 'pipe'
      })

      const client = new Client({ name: 'lingo', version: '0.1.0' })
      await client.connect(transport)
      return client
    })()
  }

  return clientTask
}

function parseMcpToolResult(
  result: { content?: Array<{ type: string; text?: string }>; isError?: boolean }
): LocalWebSearchResult[] {
  if (result.isError) {
    const message = result.content?.[0]?.text?.trim() || 'websearch-mcp error'
    throw new Error(message)
  }

  const raw = result.content?.[0]?.text
  if (!raw?.trim()) return []

  const data = JSON.parse(raw) as McpWebSearchPayload
  return data.results.map((hit) => {
    const title = hit.title?.trim() || hit.siteName?.trim() || 'Source'
    const pageText = hit.text?.trim()
    const snippet = hit.snippet?.trim() ?? ''
    return {
      title: hit.siteName ? `${title} — ${hit.siteName}` : title,
      url: hit.url?.trim() ?? '',
      snippet: snippet || (pageText ? pageText.slice(0, 280) : ''),
      pageContent: pageText && pageText.length > 80 ? pageText : undefined
    }
  })
}

/** Search via websearch-mcp subprocess (Node / Electron main). */
export async function searchViaWebsearchMcp(
  query: string,
  options?: { language?: string; region?: string }
): Promise<LocalWebSearchResult[]> {
  if (!canSpawnWebsearchMcp()) {
    return crawlViaWebsearchApi(query, options)
  }

  try {
    const client = await getMcpClient()
    const result = await client.callTool({
      name: 'web_search',
      arguments: {
        query,
        numResults: getWebsearchMaxResults(),
        language: options?.language,
        region: options?.region,
        resultType: 'all'
      }
    })

    return parseMcpToolResult(
      result as { content?: Array<{ type: string; text?: string }>; isError?: boolean }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/ECONNREFUSED|fetch failed|crawler/i.test(message)) {
      return crawlViaWebsearchApi(query, options)
    }
    throw error
  }
}
