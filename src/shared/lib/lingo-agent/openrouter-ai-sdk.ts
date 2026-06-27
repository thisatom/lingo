/**
 * Vercel AI SDK adapter — OpenRouter-compatible streaming with Lingo event mapping.
 */
import { createOpenAI } from '@ai-sdk/openai'
import { streamText, stepCountIs, type ModelMessage, type ToolSet } from 'ai'
import type { FetchFunction } from '@ai-sdk/provider-utils'
import type { ChatStreamEvent } from '@/shared/types/ipc'
import { openRouterConfig } from '@/shared/config/openrouter'
import { openRouterHeaders } from '@/shared/lib/openrouter-headers'
import { openaiCompatibleHeaders } from '@/shared/lib/openai-compatible-headers'
import {
  completionMessagesToModelMessages,
  type CompletionMessage
} from '@/shared/lib/lingo-agent/completion-messages'
import { stripAssistantStreamSafeMarkup } from '@/shared/lib/strip-assistant-role-markup'

export type OpenRouterFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export type AiSdkToolChoice =
  | 'auto'
  | 'required'
  | 'none'
  | { type: 'tool'; toolName: string }

export type AiSdkStreamParams = {
  apiKey: string
  modelId: string
  body: Record<string, unknown>
  customBackend: boolean
  baseUrl?: string
  signal?: AbortSignal
  fetchImpl: OpenRouterFetch
  tools?: ToolSet
  toolChoice?: AiSdkToolChoice
  maxToolSteps?: number
}

export type AiSdkStreamResult = {
  rawText: string
  finishReason: string | null
}

function createMergedBodyFetch(
  fetchImpl: OpenRouterFetch,
  mergeFields: Record<string, unknown>
): FetchFunction {
  return async (url, options) => {
    if (options?.body && typeof options.body === 'string') {
      const parsed = JSON.parse(options.body) as Record<string, unknown>
      const merged = { ...parsed, ...mergeFields, stream: true }
      return fetchImpl(String(url), {
        ...options,
        body: JSON.stringify(merged)
      })
    }
    return fetchImpl(String(url), options as RequestInit)
  }
}

function providerHeaders(apiKey: string, customBackend: boolean): Record<string, string> {
  if (customBackend) {
    const trimmed = apiKey.trim()
    if (!trimmed) return { 'Content-Type': 'application/json' }
    return openaiCompatibleHeaders(trimmed)
  }
  return openRouterHeaders(apiKey)
}

function extractMergeFields(body: Record<string, unknown>): Record<string, unknown> {
  const merge: Record<string, unknown> = {}
  if (body.temperature !== undefined) merge.temperature = body.temperature
  if (body.max_tokens !== undefined) merge.max_tokens = body.max_tokens
  if (body.plugins !== undefined) merge.plugins = body.plugins
  if (body.top_p !== undefined) merge.top_p = body.top_p
  if (body.frequency_penalty !== undefined) merge.frequency_penalty = body.frequency_penalty
  if (body.presence_penalty !== undefined) merge.presence_penalty = body.presence_penalty
  return merge
}

export async function streamChatCompletionViaAiSdk(
  params: AiSdkStreamParams,
  send: (event: ChatStreamEvent) => void
): Promise<AiSdkStreamResult> {
  const messages = completionMessagesToModelMessages(
    (params.body.messages as CompletionMessage[] | undefined) ?? []
  )

  if (messages.length === 0) {
    throw new Error('Model returned an empty response')
  }

  const baseURL = (params.baseUrl ?? openRouterConfig.baseURL).replace(/\/$/, '')
  const mergeFields = extractMergeFields(params.body)
  const provider = createOpenAI({
    baseURL,
    apiKey: params.apiKey.trim() || 'no-key',
    headers: providerHeaders(params.apiKey, params.customBackend),
    fetch: createMergedBodyFetch(params.fetchImpl, mergeFields)
  })

  const modelId = params.modelId.trim() || openRouterConfig.defaultModel
  const hasTools = params.tools != null && Object.keys(params.tools).length > 0
  const result = streamText({
    model: provider.chat(modelId),
    messages,
    temperature: typeof params.body.temperature === 'number' ? params.body.temperature : undefined,
    maxOutputTokens:
      typeof params.body.max_tokens === 'number' ? params.body.max_tokens : undefined,
    abortSignal: params.signal,
    tools: params.tools,
    toolChoice: hasTools ? (params.toolChoice ?? 'auto') : undefined,
    stopWhen: hasTools ? stepCountIs(params.maxToolSteps ?? 5) : stepCountIs(1)
  })

  let accumulated = ''
  let thinkingText = ''

  for await (const part of result.fullStream) {
    if (part.type === 'reasoning-delta') {
      const delta = part.text
      if (!delta) continue
      thinkingText += delta
      send({ type: 'thinking-delta', delta, text: thinkingText })
      continue
    }

    if (part.type === 'text-delta') {
      const delta = part.text
      if (!delta) continue
      accumulated += delta
      send({
        type: 'text-delta',
        delta,
        text: stripAssistantStreamSafeMarkup(accumulated)
      })
    }
  }

  const finishReason = (await result.finishReason) ?? null
  const rawText = (await result.text) || accumulated

  if (!rawText.trim() && !thinkingText.trim()) {
    throw new Error('Model returned an empty response')
  }

  return { rawText, finishReason }
}
