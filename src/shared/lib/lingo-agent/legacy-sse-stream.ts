/**
 * Legacy OpenAI-compatible SSE stream parser.
 * Used only when AI SDK streaming is disabled (Vitest) or for custom LLM backends.
 */
import type { ChatStreamEvent } from '@/shared/types/ipc'
import { extractAssistantStreamDelta } from '@/shared/lib/openrouter-model'
import { stripAssistantStreamSafeMarkup } from '@/shared/lib/strip-assistant-role-markup'

export type LegacySseFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export type LegacySseStreamParams = {
  url: string
  headers: Record<string, string>
  body: Record<string, unknown>
  signal?: AbortSignal
  fetchImpl: LegacySseFetch
  /** Map API / stream errors to user-facing messages. */
  formatError: (details: { message: string; status?: number; errText?: string }) => string
}

export type LegacySseStreamResult = {
  rawText: string
  finishReason: string | null
}

function messageFromErrText(errText: string, status: number): string {
  try {
    const parsed = JSON.parse(errText) as { error?: { message?: string } }
    if (parsed.error?.message?.trim()) return parsed.error.message.trim()
  } catch {
    // keep fallback
  }
  return errText.trim() || `API request failed (${status})`
}

type ReasoningDetail = {
  type?: string
  text?: string
  summary?: string
}

type StreamDelta = {
  content?: string | Array<{ type?: string; text?: string }>
  reasoning?: string
  reasoning_content?: string
  reasoning_details?: ReasoningDetail[]
}

type StreamMessage = {
  content?: string | Array<{ type?: string; text?: string }>
  reasoning?: string
  reasoning_content?: string
  reasoning_details?: ReasoningDetail[]
}

export type SseChunk = {
  choices?: Array<{
    delta?: StreamDelta
    message?: StreamMessage
    finish_reason?: string | null
  }>
  error?: { message?: string }
}

function reasoningFromContentParts(
  content: string | Array<{ type?: string; text?: string }> | undefined
): string {
  if (!content || typeof content === 'string') return ''
  return content
    .filter((part) => part.type === 'reasoning' || part.type === 'thinking')
    .map((part) => part.text ?? '')
    .join('')
}

function reasoningFromDetails(details: ReasoningDetail[] | undefined): string {
  if (!details?.length) return ''
  return details
    .map((part) => part.text?.trim() || part.summary?.trim() || '')
    .filter(Boolean)
    .join('')
}

export function extractStreamDelta(chunk: SseChunk): string {
  return extractAssistantStreamDelta(chunk.choices?.[0]?.delta ?? {})
}

export function extractStreamReasoning(chunk: SseChunk): string {
  const choice = chunk.choices?.[0]
  const delta = choice?.delta
  const message = choice?.message

  if (delta) {
    if (typeof delta.reasoning === 'string' && delta.reasoning) return delta.reasoning
    if (typeof delta.reasoning_content === 'string' && delta.reasoning_content) {
      return delta.reasoning_content
    }
    const fromDetails = reasoningFromDetails(delta.reasoning_details)
    if (fromDetails) return fromDetails
    const fromParts = reasoningFromContentParts(delta.content)
    if (fromParts) return fromParts
  }

  if (message) {
    if (typeof message.reasoning === 'string' && message.reasoning) return message.reasoning
    if (typeof message.reasoning_content === 'string' && message.reasoning_content) {
      return message.reasoning_content
    }
    const fromParts = reasoningFromContentParts(message.content)
    if (fromParts) return fromParts
  }

  return ''
}

export async function streamCompletionViaLegacySse(
  params: LegacySseStreamParams,
  send: (event: ChatStreamEvent) => void
): Promise<LegacySseStreamResult> {
  const response = await params.fetchImpl(params.url, {
    method: 'POST',
    headers: params.headers,
    body: JSON.stringify({ ...params.body, stream: true }),
    signal: params.signal
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(
      params.formatError({
        message: messageFromErrText(errText, response.status),
        status: response.status,
        errText: errText || undefined
      })
    )
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Streaming response has no body')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let accumulatedText = ''
  let streamSafeText = ''
  let thinkingText = ''
  let finishReason: string | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let lineEnd = buffer.indexOf('\n')
    while (lineEnd !== -1) {
      const rawLine = buffer.slice(0, lineEnd).trim()
      buffer = buffer.slice(lineEnd + 1)
      lineEnd = buffer.indexOf('\n')

      if (!rawLine.startsWith('data:')) continue
      const payload = rawLine.slice(rawLine.startsWith('data: ') ? 6 : 5).trim()
      if (!payload || payload === '[DONE]') continue

      let chunk: SseChunk
      try {
        chunk = JSON.parse(payload) as SseChunk
      } catch {
        continue
      }

      if (chunk.error?.message) {
        throw new Error(params.formatError({ message: chunk.error.message }))
      }

      const reasoning = extractStreamReasoning(chunk)
      if (reasoning) {
        thinkingText += reasoning
        send({ type: 'thinking-delta', delta: reasoning, text: thinkingText })
      }

      const delta = extractStreamDelta(chunk)
      if (delta) {
        accumulatedText += delta
        streamSafeText = stripAssistantStreamSafeMarkup(accumulatedText)
        send({ type: 'text-delta', delta, text: streamSafeText })
      }

      const fr = chunk.choices?.[0]?.finish_reason
      if (fr) finishReason = fr
    }
  }

  if (!streamSafeText.trim() && !thinkingText.trim()) {
    throw new Error('Model returned an empty response')
  }

  return { rawText: accumulatedText, finishReason }
}
