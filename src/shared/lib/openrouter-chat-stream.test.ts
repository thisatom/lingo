import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChatStreamEvent } from '@/shared/types/ipc'

const performLocalWebSearchMock = vi.hoisted(() => vi.fn())

vi.mock('@/shared/lib/local-web-search-runtime', () => ({
  isLocalWebSearchRegistered: () => true
}))

vi.mock('@/shared/lib/local-web-search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/local-web-search')>()
  return {
    ...actual,
    performLocalWebSearch: (...args: Parameters<typeof performLocalWebSearchMock>) =>
      performLocalWebSearchMock(...args)
  }
})

import { streamOpenRouterChat } from './openrouter-chat-stream'
import { LocalWebSearchError } from './local-web-search-errors'

function sseResponse(chunks: object[]): Response {
  const body =
    chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n'
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(body))
        controller.close()
      }
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
  )
}

function collectStream(
  request: Parameters<typeof streamOpenRouterChat>[0],
  fetchImpl: typeof fetch
): Promise<ChatStreamEvent[]> {
  const events: ChatStreamEvent[] = []
  return streamOpenRouterChat(
    request,
    (event) => {
      events.push(event)
    },
    async () => 'test-key',
    { fetchImpl, defaultModel: 'openrouter/free' }
  ).then(() => events)
}

describe('streamOpenRouterChat', () => {
  beforeEach(() => {
    performLocalWebSearchMock.mockReset()
    performLocalWebSearchMock.mockResolvedValue([
      { title: 'Example', url: 'https://example.com', snippet: 'Snippet text' }
    ])
  })

  it('streams reasoning then answer without per-chunk truncation', async () => {
    const fetchImpl = vi.fn(async () =>
      sseResponse([
        {
          choices: [{ delta: { reasoning: 'Plan step one.' } }]
        },
        {
          choices: [{ delta: { content: 'П' } }]
        },
        {
          choices: [{ delta: { content: '\n' } }]
        },
        {
          choices: [{ delta: { content: 'ривет!' } }]
        },
        {
          choices: [{ finish_reason: 'stop' }]
        }
      ])
    )

    const events = await collectStream(
      {
        messages: [{ role: 'user', content: 'Say hello' }],
        webSearch: false
      },
      fetchImpl
    )

    const thinking = events.filter((e) => e.type === 'thinking-delta')
    const textDeltas = events.filter((e) => e.type === 'text-delta')
    const done = events.find((e) => e.type === 'done')

    expect(thinking.length).toBeGreaterThan(0)
    expect(thinking.at(-1)).toMatchObject({ text: 'Plan step one.' })
    expect(textDeltas.at(-1)).toMatchObject({ text: 'П\nривет!' })
    expect(done?.type === 'done' && done.text).toBe('П\nривет!')
  })

  it('preserves streamed answer when done text is empty', async () => {
    const fetchImpl = vi.fn(async () =>
      sseResponse([
        {
          choices: [{ delta: { content: 'From deltas only.' } }]
        },
        {
          choices: [{ finish_reason: 'stop' }]
        }
      ])
    )

    const events = await collectStream(
      {
        messages: [{ role: 'user', content: 'Hello' }],
        webSearch: false
      },
      fetchImpl
    )

    const done = events.find((e) => e.type === 'done')
    expect(done?.type === 'done' && done.text).toBe('From deltas only.')
  })

  it('merges web-search retry text instead of resetting the stream', async () => {
    let call = 0
    const fetchImpl = vi.fn(async () => {
      call += 1
      if (call === 1) {
        return sseResponse([
          {
            choices: [{ delta: { content: 'Short' } }]
          },
          {
            choices: [{ finish_reason: 'stop' }]
          }
        ])
      }
      return sseResponse([
        {
          choices: [{ delta: { content: ' complete answer.' } }]
        },
        {
          choices: [{ finish_reason: 'stop' }]
        }
      ])
    })

    const events = await collectStream(
      {
        messages: [{ role: 'user', content: 'search the web for quantum computing news' }],
        webSearch: false,
        maxTokens: 2048
      },
      fetchImpl
    )

    const doneEvents = events.filter((e) => e.type === 'done')
    expect(doneEvents).toHaveLength(1)
    const textDeltas = events.filter((e) => e.type === 'text-delta')
    expect(textDeltas.at(-1)?.type === 'text-delta' && textDeltas.at(-1)?.text).toBe(
      'Short complete answer.'
    )
    const done = events.find((e) => e.type === 'done')
    expect(done?.type === 'done' && done.text).toBe('Short complete answer.')
  })

  it('keeps cumulative text-delta length monotonic during web-search retry merge', async () => {
    let call = 0
    const fetchImpl = vi.fn(async () => {
      call += 1
      if (call === 1) {
        return sseResponse([
          { choices: [{ delta: { content: 'Short' } }] },
          { choices: [{ finish_reason: 'stop' }] }
        ])
      }
      return sseResponse([
        { choices: [{ delta: { content: ' complete answer.' } }] },
        { choices: [{ finish_reason: 'stop' }] }
      ])
    })

    const events = await collectStream(
      {
        messages: [{ role: 'user', content: 'search the web for quantum computing news' }],
        webSearch: false,
        maxTokens: 2048
      },
      fetchImpl
    )

    let prevLength = 0
    for (const event of events) {
      if (event.type !== 'text-delta') continue
      expect(event.text.length).toBeGreaterThanOrEqual(prevLength)
      prevLength = event.text.length
    }
    expect(prevLength).toBeGreaterThan(0)
  })

  it('runs local web search for explicit force-search phrases when toggle is off', async () => {
    const fetchImpl = vi.fn(async () =>
      sseResponse([
        {
          choices: [{ delta: { content: 'Answer with citation.' } }]
        },
        {
          choices: [{ finish_reason: 'stop' }]
        }
      ])
    )

    await collectStream(
      {
        messages: [{ role: 'user', content: 'search the web for latest Mars news' }],
        webSearch: false
      },
      fetchImpl
    )

    expect(performLocalWebSearchMock).toHaveBeenCalledOnce()
    expect(performLocalWebSearchMock.mock.calls[0]?.[0]).toBe('latest Mars news')
  })

  it('runs web search for any non-empty message when toggle is on', async () => {
    const fetchImpl = vi.fn(async () =>
      sseResponse([
        {
          choices: [{ delta: { content: 'Привет! У меня всё хорошо, спасибо что спросил.' } }]
        },
        {
          choices: [{ finish_reason: 'stop' }]
        }
      ])
    )

    await collectStream(
      {
        messages: [{ role: 'user', content: 'как у тебя дела' }],
        webSearch: true
      },
      fetchImpl
    )

    expect(performLocalWebSearchMock).toHaveBeenCalledOnce()
    expect(performLocalWebSearchMock.mock.calls[0]?.[0]).toBe('как у тебя дела')
  })

  it('runs web search for factual questions when toggle is on', async () => {
    const fetchImpl = vi.fn(async () =>
      sseResponse([
        {
          choices: [{ delta: { content: 'Quantum computing is…' } }]
        },
        {
          choices: [{ finish_reason: 'stop' }]
        }
      ])
    )

    await collectStream(
      {
        messages: [
          { role: 'user', content: 'What is quantum computing in simple terms?' }
        ],
        webSearch: true
      },
      fetchImpl
    )

    expect(performLocalWebSearchMock).toHaveBeenCalledOnce()
  })

  it('skips web search when the latest user turn has image attachments', async () => {
    const fetchImpl = vi.fn(async () =>
      sseResponse([
        {
          choices: [{ delta: { content: 'Describing the attachment.' } }]
        },
        {
          choices: [{ finish_reason: 'stop' }]
        }
      ])
    )

    await collectStream(
      {
        messages: [
          {
            role: 'user',
            content: 'search the web for Mars news\n\n[Attached image: photo.png]'
          }
        ],
        webSearch: false
      },
      fetchImpl
    )

    expect(performLocalWebSearchMock).not.toHaveBeenCalled()
    expect(fetchImpl).toHaveBeenCalled()
  })

  it('falls back to regular completion when custom endpoint search fails', async () => {
    performLocalWebSearchMock.mockRejectedValueOnce(
      new LocalWebSearchError('lookup failed', 'network')
    )

    const fetchImpl = vi.fn(async () =>
      sseResponse([
        {
          choices: [{ delta: { content: 'Answer without live search.' } }]
        },
        {
          choices: [{ finish_reason: 'stop' }]
        }
      ])
    )

    const events = await collectStream(
      {
        messages: [{ role: 'user', content: 'What is quantum computing?' }],
        webSearch: true,
        llmBackend: 'custom',
        customLlm: {
          baseUrl: 'https://llm.example/v1',
          model: 'local/model',
          maxTokens: 1024,
          maxTokensRetry: 2048
        }
      },
      fetchImpl
    )

    expect(performLocalWebSearchMock).toHaveBeenCalledOnce()
    expect(fetchImpl).toHaveBeenCalled()
    expect(events.some((e) => e.type === 'search-fallback')).toBe(true)
    expect(events.some((e) => e.type === 'done')).toBe(true)
  })

  it('streams assistant continuation from prefix without web search', async () => {
    const fetchImpl = vi.fn(async () =>
      sseResponse([
        {
          choices: [{ delta: { content: ' there was a kingdom.' } }]
        },
        {
          choices: [{ finish_reason: 'stop' }]
        }
      ])
    )

    const events = await collectStream(
      {
        messages: [{ role: 'user', content: 'Tell me a story' }],
        assistantContinuationPrefix: 'Once upon a time'
      },
      fetchImpl
    )

    expect(performLocalWebSearchMock).not.toHaveBeenCalled()
    expect(events.some((e) => e.type === 'searching')).toBe(false)
    expect(events.at(-1)).toEqual({
      type: 'done',
      text: 'Once upon a time there was a kingdom.'
    })
  })
})
