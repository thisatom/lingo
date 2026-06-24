import { describe, expect, it, vi } from 'vitest'
import type { ChatStreamEvent } from '@/shared/types/ipc'

import {
  extractStreamDelta,
  extractStreamReasoning,
  streamCompletionViaLegacySse
} from './legacy-sse-stream'

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

describe('legacy-sse-stream', () => {
  it('extractStreamReasoning reads delta.reasoning', () => {
    expect(
      extractStreamReasoning({
        choices: [{ delta: { reasoning: 'Plan step one.' } }]
      })
    ).toBe('Plan step one.')
  })

  it('extractStreamDelta reads delta.content', () => {
    expect(
      extractStreamDelta({
        choices: [{ delta: { content: 'Hello' } }]
      })
    ).toBe('Hello')
  })

  it('streams reasoning then answer without per-chunk truncation', async () => {
    const fetchImpl = vi.fn(async () =>
      sseResponse([
        { choices: [{ delta: { reasoning: 'Plan step one.' } }] },
        { choices: [{ delta: { content: 'П' } }] },
        { choices: [{ delta: { content: '\n' } }] },
        { choices: [{ delta: { content: 'ривет!' } }] },
        { choices: [{ finish_reason: 'stop' }] }
      ])
    )

    const events: ChatStreamEvent[] = []
    const result = await streamCompletionViaLegacySse(
      {
        url: 'https://example.com/chat/completions',
        headers: { 'Content-Type': 'application/json' },
        body: { model: 'test', messages: [] },
        fetchImpl
      },
      (event) => events.push(event)
    )

    const thinking = events.filter((e) => e.type === 'thinking-delta')
    const textDeltas = events.filter((e) => e.type === 'text-delta')

    expect(thinking.at(-1)).toMatchObject({ text: 'Plan step one.' })
    expect(textDeltas.at(-1)).toMatchObject({ text: 'П\nривет!' })
    expect(result.rawText).toBe('П\nривет!')
    expect(result.finishReason).toBe('stop')
  })

  it('throws formatted API errors', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ error: { message: 'Rate limited' } }), { status: 429 })
    )

    await expect(
      streamCompletionViaLegacySse(
        {
          url: 'https://example.com/chat/completions',
          headers: {},
          body: { model: 'test', messages: [] },
          fetchImpl,
          formatError: ({ message }) => `ERR: ${message}`
        },
        () => {}
      )
    ).rejects.toThrow('ERR: Rate limited')
  })
})
