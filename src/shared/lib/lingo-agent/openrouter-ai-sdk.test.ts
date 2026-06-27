import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChatStreamEvent } from '@/shared/types/ipc'

const streamTextMock = vi.hoisted(() => vi.fn())

vi.mock('ai', () => ({
  streamText: (...args: unknown[]) => streamTextMock(...args),
  stepCountIs: (n: number) => n
}))

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => ({
    chat: vi.fn(() => 'mock-model')
  }))
}))

import { streamChatCompletionViaAiSdk } from './openrouter-ai-sdk'

describe('streamChatCompletionViaAiSdk', () => {
  beforeEach(() => {
    streamTextMock.mockReset()
  })

  it('reads text-delta.text from AI SDK fullStream (not .delta)', async () => {
    async function* fullStream() {
      yield { type: 'text-delta', id: '0', text: 'User Safety: safe\n\n' }
      yield { type: 'text-delta', id: '0', text: 'Driver outline.' }
    }

    streamTextMock.mockReturnValue({
      get fullStream() {
        return fullStream()
      },
      finishReason: Promise.resolve('stop'),
      text: Promise.resolve('User Safety: safe\n\nDriver outline.')
    })

    const events: ChatStreamEvent[] = []
    const result = await streamChatCompletionViaAiSdk(
      {
        apiKey: 'test-key',
        modelId: 'openrouter/free',
        body: {
          messages: [{ role: 'user', content: 'hello' }],
          temperature: 0.7
        },
        customBackend: false,
        fetchImpl: vi.fn(),
        signal: undefined
      },
      (event) => {
        events.push(event)
      }
    )

    const textDeltas = events.filter((e) => e.type === 'text-delta')
    expect(textDeltas.at(-1)).toMatchObject({
      text: '\n\nDriver outline.'
    })
    expect(result.rawText).toBe('User Safety: safe\n\nDriver outline.')
    expect(result.rawText).not.toContain('undefined')
  })

  it('does not append literal undefined when text-delta lacks .delta', async () => {
    async function* fullStream() {
      yield { type: 'text-delta', id: '0', text: 'Hello' }
      yield { type: 'text-delta', id: '0', text: ' world' }
    }

    streamTextMock.mockReturnValue({
      get fullStream() {
        return fullStream()
      },
      finishReason: Promise.resolve('stop'),
      text: Promise.resolve('')
    })

    const events: ChatStreamEvent[] = []
    const result = await streamChatCompletionViaAiSdk(
      {
        apiKey: 'test-key',
        modelId: 'openrouter/free',
        body: { messages: [{ role: 'user', content: 'hi' }] },
        customBackend: false,
        fetchImpl: vi.fn()
      },
      (event) => {
        events.push(event)
      }
    )

    expect(result.rawText).toBe('Hello world')
    expect(events.filter((e) => e.type === 'text-delta').at(-1)).toMatchObject({
      text: 'Hello world'
    })
  })
})
