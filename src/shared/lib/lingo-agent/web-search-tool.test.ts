import { describe, expect, it, vi } from 'vitest'

const performLocalWebSearchMock = vi.hoisted(() => vi.fn())

vi.mock('@/shared/lib/local-web-search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/local-web-search')>()
  return {
    ...actual,
    performLocalWebSearch: (...args: Parameters<typeof performLocalWebSearchMock>) =>
      performLocalWebSearchMock(...args)
  }
})

import { createWebSearchTool, WEB_SEARCH_TOOL_NAME } from './web-search-tool'

describe('createWebSearchTool', () => {
  it('exposes web_search tool name via factory', () => {
    expect(WEB_SEARCH_TOOL_NAME).toBe('web_search')
    const toolDef = createWebSearchTool({})
    expect(toolDef.description).toContain('Search the web')
  })

  it('calls performLocalWebSearch and returns formatted summary', async () => {
    performLocalWebSearchMock.mockResolvedValue([
      { title: 'Example', url: 'https://example.com', snippet: 'Snippet text', pageContent: 'Body' }
    ])

    const onInitialResults = vi.fn()
    const onVisitingUrl = vi.fn()
    const toolDef = createWebSearchTool({
      locale: 'en-US',
      onInitialResults,
      onVisitingUrl
    })

    expect(toolDef.execute).toBeDefined()
    const output = await toolDef.execute!(
      { query: 'mars news' },
      { toolCallId: '1', messages: [] }
    )

    expect(performLocalWebSearchMock).toHaveBeenCalledWith('mars news', {
      locale: 'en-US',
      signal: undefined,
      onInitialResults,
      onVisitingUrl
    })
    expect(output.resultCount).toBe(1)
    expect(output.summary).toContain('Web research')
    expect(output.summary).toContain('mars news')
  })
})
