import type {
  ChatMessagePayload,
  ChatStreamEvent,
  CustomLlmConfig,
  LlmBackend
} from '@/shared/types/ipc'
import { resolveChatCompletionsUrl } from '@/shared/config/custom-llm'
import { customLlmConfig } from '@/shared/config/custom-llm'
import { openRouterConfig } from '@/shared/config/openrouter'
import { buildLingoSystemPrompt } from '@/shared/lib/lingo-agent/prompts'
import { resolveAgentPromptMode } from '@/shared/lib/lingo-agent/turn-policy'
import { normalizeAlternatingChatPayloads } from '@/shared/lib/chat-api-alternation'
import {
  customEndpointRequiresApiKey,
  formatCustomLlmHttpError
} from '@/shared/lib/custom-llm-errors'
import { mergeCustomCompletionBody } from '@/shared/lib/custom-llm-profile'
import { assertOutboundHttpUrl } from '@/shared/lib/outbound-url-policy'
import { openaiCompatibleHeaders } from '@/shared/lib/openai-compatible-headers'
import {
  buildAssistantContinueUserMessage,
  buildCompletionRetryUserMessage,
  mergeContinuationAnswer,
  shouldRetryIncompleteCompletion
} from '@/shared/lib/completion-quality'
import {
  getLastUserMessageContent,
  isSubstantiveReply,
  looksTruncatedOrRefusal,
  optimizeWebSearchQuery,
  shouldRetryWebSearchAnswer
} from '@/shared/lib/web-search-intent'
import {
  formatOpenRouterError,
  isOpenRouterCreditError
} from '@/shared/lib/openrouter-errors'
import { openRouterHeaders } from '@/shared/lib/openrouter-headers'
import {
  extractAssistantStreamDelta,
} from '@/shared/lib/openrouter-model'
import {
  stripAssistantRoleMarkup,
  stripAssistantStreamSafeMarkup
} from '@/shared/lib/strip-assistant-role-markup'
import {
  isLocalWebSearchRegistered
} from '@/shared/lib/local-web-search-runtime'
import { localeForPracticeLanguage, type LocalWebSearchResult } from '@/shared/lib/local-web-search'
import { performLocalWebSearch } from '@/shared/lib/local-web-search'
import { shouldTryExternalWebSearch } from '@/shared/lib/web-search-pipeline'
import { streamChatCompletionViaAiSdk, type AiSdkToolChoice } from '@/shared/lib/lingo-agent/openrouter-ai-sdk'
import { streamCompletionViaLegacySse } from '@/shared/lib/lingo-agent/legacy-sse-stream'
import { shouldUseAiSdkStreamForRequest } from '@/shared/lib/lingo-agent/stream-config'
import { webSearchTools, WEB_SEARCH_TOOL_NAME } from '@/shared/lib/lingo-agent/web-search-tool'
import {
  isLocalWebSearchFailure,
  SEARCH_FALLBACK_NOTICE
} from '@/shared/lib/local-web-search-errors'
import { resolveWebSearchForStreamTurn } from '@/shared/lib/web-search-turn'
import {
  isWebSearchApiError,
  isWebSearchResultFailure,
  substituteMessagesWithLocalWebSearchResults
} from '@/shared/lib/web-search-messages'
import { mapResultsToSearchTargets } from '@/shared/lib/web-search-targets'
import {
  isVisionApiError,
  substituteMessagesWithOcr
} from '@/shared/lib/image-ocr-messages'
import { runWithModelFallback } from '@/shared/lib/openrouter-model-fallback'
import { isVisionCapableModel, messagesHaveImages } from '@/shared/lib/vision-models'

export { normalizeOpenRouterModelId } from '@/shared/config/openrouter'

type SendEvent = (event: ChatStreamEvent) => void
type PromptMode = 'research' | 'practice' | 'vision' | 'general'

type AiSdkStreamExtras = {
  tools?: Parameters<typeof streamChatCompletionViaAiSdk>[0]['tools']
  toolChoice?: AiSdkToolChoice
  maxToolSteps?: number
}

export type OpenRouterStreamRequest = {
  messages: ChatMessagePayload[]
  model?: string
  practiceLanguage?: string
  /** When false, use general assistant prompt instead of language practice. */
  languagePractice?: boolean
  llmBackend?: LlmBackend
  customLlm?: CustomLlmConfig
  webSearch?: boolean
  modelAutoFallback?: boolean
  maxTokens?: number
  maxTokensRetry?: number
  /** When set, stream only the continuation after this assistant prefix. */
  assistantContinuationPrefix?: string
}

function isCustomBackend(request: OpenRouterStreamRequest): boolean {
  return request.llmBackend === 'custom'
}

function chatCompletionsUrl(request: OpenRouterStreamRequest): string {
  if (isCustomBackend(request) && request.customLlm?.baseUrl) {
    const target = resolveChatCompletionsUrl(request.customLlm.baseUrl)
    assertOutboundHttpUrl(target, { allowPrivateNetwork: true })
    return target
  }
  return `${openRouterConfig.baseURL}/chat/completions`
}

function requestHeaders(request: OpenRouterStreamRequest, apiKey: string): Record<string, string> {
  if (isCustomBackend(request)) {
    const trimmed = apiKey.trim()
    if (!trimmed) return { 'Content-Type': 'application/json' }
    return openaiCompatibleHeaders(trimmed)
  }
  return openRouterHeaders(apiKey)
}

function maxTokensBudget(request: OpenRouterStreamRequest): number | undefined {
  if (request.maxTokens === 0) return undefined
  if (typeof request.maxTokens === 'number' && request.maxTokens > 0) {
    return request.maxTokens
  }
  return isCustomBackend(request) ? customLlmConfig.maxTokens : openRouterConfig.maxTokens
}

function maxTokensRetryBudget(request: OpenRouterStreamRequest): number | undefined {
  if (request.maxTokens === 0) return undefined
  if (typeof request.maxTokensRetry === 'number') {
    if (request.maxTokensRetry === 0) return undefined
    return request.maxTokensRetry
  }
  const primary = maxTokensBudget(request)
  if (primary === undefined) return undefined
  return isCustomBackend(request) ? customLlmConfig.maxTokensRetry : openRouterConfig.maxTokensRetry
}

function applyCompletionMaxTokens(
  body: Record<string, unknown>,
  request: OpenRouterStreamRequest,
  kind: 'primary' | 'retry' = 'primary'
): Record<string, unknown> {
  const budget = kind === 'retry' ? maxTokensRetryBudget(request) : maxTokensBudget(request)
  if (budget === undefined) {
    const { max_tokens: _removed, ...rest } = body
    return rest
  }
  return { ...body, max_tokens: budget }
}

function withCustomCompletionExtras(
  request: OpenRouterStreamRequest,
  body: Record<string, unknown>
): Record<string, unknown> {
  const merged = isCustomBackend(request)
    ? mergeCustomCompletionBody(body, request.customLlm?.completionExtras)
    : body
  if (request.maxTokens === 0) {
    const { max_tokens: _removed, ...rest } = merged
    return rest
  }
  return merged
}

export type OpenRouterFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export type OpenRouterStreamOptions = {
  defaultModel?: string
  /** Electron main: HTTPS keep-alive fetch. */
  fetchImpl?: OpenRouterFetch
}

function systemPrompt(
  practiceLanguage: string | undefined,
  mode: PromptMode,
  languagePractice = true
): string {
  return buildLingoSystemPrompt(practiceLanguage, mode, languagePractice)
}

function isLanguagePracticeEnabled(request: OpenRouterStreamRequest): boolean {
  return request.languagePractice !== false
}

function payloadHasContent(content: ChatMessagePayload['content']): boolean {
  if (typeof content === 'string') return content.trim().length > 0
  return content.some(
    (p) =>
      (p.type === 'text' && p.text.trim().length > 0) ||
      (p.type === 'image_url' && Boolean(p.image_url.url?.startsWith('data:')))
  )
}

function assistantTextLength(content: ChatMessagePayload['content']): number {
  if (typeof content === 'string') return content.trim().length
  return content
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
    .trim().length
}

function filterHistoryForApi(
  messages: ChatMessagePayload[],
  researchMode: boolean
): ChatMessagePayload[] {
  const filtered = messages.filter((m) => {
    if (m.role === 'system') return false
    if (researchMode && m.role === 'assistant' && assistantTextLength(m.content) < 48) {
      return false
    }
    return payloadHasContent(m.content)
  })
  return normalizeAlternatingChatPayloads(filtered)
}

function buildMessages(
  messages: ChatMessagePayload[],
  practiceLanguage: string | undefined,
  mode: PromptMode,
  languagePractice = true
): Array<{ role: string; content: string | ChatMessagePayload['content'] }> {
  const researchMode = mode === 'research'
  return [
    { role: 'system', content: systemPrompt(practiceLanguage, mode, languagePractice) },
    ...filterHistoryForApi(messages, researchMode).map((m) => ({
      role: m.role,
      content: m.content
    }))
  ]
}

function appendWebSearchToolHint(
  messages: Array<{ role: string; content: string | ChatMessagePayload['content'] }>,
  searchQuery: string
): Array<{ role: string; content: string | ChatMessagePayload['content'] }> {
  if (messages.length === 0 || messages[0]?.role !== 'system') return messages
  const system = messages[0]!
  const hint = `\n\nBefore answering, call the ${WEB_SEARCH_TOOL_NAME} tool once with query: "${searchQuery}".`
  const content =
    typeof system.content === 'string' ? `${system.content}${hint}` : system.content
  return [{ ...system, content }, ...messages.slice(1)]
}

function modelUsesNativeWebSearch(modelId: string): boolean {
  const id = modelId.toLowerCase()
  return id.startsWith('perplexity/') || id.includes(':online')
}

type CompletionResult = {
  text: string
  streamSafeText: string
  rawText: string
  finishReason: string | null
}

function toCompletionResult(rawText: string, finishReason: string | null): CompletionResult {
  return {
    rawText,
    streamSafeText: stripAssistantStreamSafeMarkup(rawText),
    text: stripAssistantRoleMarkup(rawText),
    finishReason
  }
}

function parseApiError(
  errText: string,
  status: number,
  customBackend: boolean
): string {
  try {
    const parsed = JSON.parse(errText) as {
      error?: { message?: string }
      detail?: string
      title?: string
    }
    const message =
      parsed.error?.message?.trim() ||
      parsed.detail?.trim() ||
      parsed.title?.trim() ||
      ''
    if (message) {
      return customBackend ? formatCustomLlmHttpError(message, status) : message
    }
  } catch {
    // ignore
  }
  const fallback = errText || `API request failed (${status})`
  return customBackend ? formatCustomLlmHttpError(fallback, status) : fallback
}

async function fetchCompletion(
  request: OpenRouterStreamRequest,
  apiKey: string,
  body: Record<string, unknown>,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch
): Promise<CompletionResult> {
  const url = chatCompletionsUrl(request)
  if (!url) throw new Error('Custom API base URL is not configured.')

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: requestHeaders(request, apiKey),
    body: JSON.stringify({ ...body, stream: false }),
    signal
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    const custom = isCustomBackend(request)
    const message = parseApiError(errText, response.status, custom)
    throw new Error(custom ? message : formatOpenRouterError(message))
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string | Array<{ type?: string; text?: string }> }
      finish_reason?: string | null
    }>
    error?: { message?: string }
  }

  if (data.error?.message) {
    const message = data.error.message
    throw new Error(isCustomBackend(request) ? message : formatOpenRouterError(message))
  }

  const choice = data.choices?.[0]
  const raw = extractAssistantStreamDelta(choice?.message ?? {})
  if (!raw.trim()) {
    throw new Error('Model returned an empty response')
  }

  return toCompletionResult(raw, choice?.finish_reason ?? null)
}

async function fetchCompletionResilient(
  request: OpenRouterStreamRequest,
  apiKey: string,
  body: Record<string, unknown>,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch
): Promise<CompletionResult> {
  try {
    return await fetchCompletion(request, apiKey, body, signal, fetchImpl)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const maxTokens = body.max_tokens
    if (
      isCustomBackend(request) ||
      !isOpenRouterCreditError(message) ||
      typeof maxTokens !== 'number' ||
      maxTokens <= openRouterConfig.maxTokensCreditFallback
    ) {
      throw error
    }
    return fetchCompletion(
      request,
      apiKey,
      { ...body, max_tokens: openRouterConfig.maxTokensCreditFallback },
      signal,
      fetchImpl
    )
  }
}

async function fetchCompletionStreamingViaAiSdk(
  request: OpenRouterStreamRequest,
  apiKey: string,
  body: Record<string, unknown>,
  send: SendEvent,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch,
  aiSdkExtras?: AiSdkStreamExtras
): Promise<CompletionResult> {
  const custom = isCustomBackend(request)
  const baseUrl = custom
    ? chatCompletionsUrl(request).replace(/\/chat\/completions\/?$/, '')
    : undefined

  const { rawText, finishReason } = await streamChatCompletionViaAiSdk(
    {
      apiKey,
      modelId: String(body.model ?? request.model ?? openRouterConfig.defaultModel),
      body,
      customBackend: custom,
      baseUrl,
      signal,
      fetchImpl,
      tools: aiSdkExtras?.tools,
      toolChoice: aiSdkExtras?.toolChoice,
      maxToolSteps: aiSdkExtras?.maxToolSteps
    },
    send
  )

  return toCompletionResult(rawText, finishReason)
}

async function fetchCompletionStreaming(
  request: OpenRouterStreamRequest,
  apiKey: string,
  body: Record<string, unknown>,
  send: SendEvent,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch,
  aiSdkExtras?: AiSdkStreamExtras
): Promise<CompletionResult> {
  if (shouldUseAiSdkStreamForRequest(request)) {
    return fetchCompletionStreamingViaAiSdk(
      request,
      apiKey,
      withCustomCompletionExtras(request, body),
      send,
      signal,
      fetchImpl,
      aiSdkExtras
    )
  }

  const merged = withCustomCompletionExtras(request, { ...body, stream: true })
  if (merged.stream === false) {
    const result = await fetchCompletion(request, apiKey, body, signal, fetchImpl)
    send({ type: 'text-delta', delta: result.text, text: result.streamSafeText })
    return result
  }

  const url = chatCompletionsUrl(request)
  if (!url) throw new Error('Custom API base URL is not configured.')

  const custom = isCustomBackend(request)
  const { rawText, finishReason } = await streamCompletionViaLegacySse(
    {
      url,
      headers: requestHeaders(request, apiKey),
      body: merged,
      signal,
      fetchImpl,
      formatError: ({ message, status, errText }) => {
        const parsed =
          status != null && errText != null
            ? parseApiError(errText, status, custom)
            : message
        return custom ? parsed : formatOpenRouterError(parsed)
      }
    },
    send
  )

  return toCompletionResult(rawText, finishReason)
}

type ChatCompletionMessage = {
  role: string
  content: string | ChatMessagePayload['content']
}

async function streamCompletionWithIncompleteRetry(
  request: OpenRouterStreamRequest,
  apiKey: string,
  body: Record<string, unknown>,
  send: SendEvent,
  lastUserMessage: string,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch,
  options: { requireSubstantive: boolean; aiSdkExtras?: AiSdkStreamExtras }
): Promise<CompletionResult> {
  let result = await fetchCompletionResilientStreaming(
    request,
    apiKey,
    body,
    send,
    signal,
    fetchImpl,
    options.aiSdkExtras
  )

  if (
    !shouldRetryIncompleteCompletion({
      answer: result.text,
      finishReason: result.finishReason,
      userMessage: lastUserMessage,
      requireSubstantive: options.requireSubstantive,
      customBackend: isCustomBackend(request)
    })
  ) {
    return result
  }

  const streamPrefix = result.streamSafeText
  const retryMessages: ChatCompletionMessage[] = [
    ...(body.messages as ChatCompletionMessage[]),
    { role: 'assistant', content: result.text },
    { role: 'user', content: buildCompletionRetryUserMessage(lastUserMessage) }
  ]

  const continuation = await fetchCompletionResilientStreaming(
    request,
    apiKey,
    applyCompletionMaxTokens({ ...body, messages: retryMessages }, request, 'retry'),
    (event) => {
      if (event.type === 'text-delta') {
        send({
          type: 'text-delta',
          delta: event.delta,
          text: mergeContinuationAnswer(streamPrefix, event.text)
        })
        return
      }
      if (event.type === 'thinking-delta') {
        return
      }
      send(event)
    },
    signal,
    fetchImpl,
    options.aiSdkExtras ? { ...options.aiSdkExtras, toolChoice: 'auto' } : undefined
  )

  const mergedRaw = mergeContinuationAnswer(result.rawText, continuation.rawText)
  return toCompletionResult(mergedRaw, continuation.finishReason)
}

async function streamAssistantContinuationOnly(
  request: OpenRouterStreamRequest,
  apiKey: string,
  body: Record<string, unknown>,
  prefix: string,
  lastUserMessage: string,
  send: SendEvent,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch,
  aiSdkExtras?: AiSdkStreamExtras
): Promise<CompletionResult> {
  const retryMessages: ChatCompletionMessage[] = [
    ...(body.messages as ChatCompletionMessage[]),
    { role: 'assistant', content: prefix },
    { role: 'user', content: buildAssistantContinueUserMessage(lastUserMessage) }
  ]

  return fetchCompletionResilientStreaming(
    request,
    apiKey,
    applyCompletionMaxTokens({ ...body, messages: retryMessages }, request, 'retry'),
    (event) => {
      if (event.type === 'text-delta') {
        send({
          type: 'text-delta',
          delta: event.delta,
          text: mergeContinuationAnswer(prefix, event.text)
        })
        return
      }
      if (event.type === 'thinking-delta') {
        return
      }
      send(event)
    },
    signal,
    fetchImpl,
    aiSdkExtras ? { ...aiSdkExtras, toolChoice: 'auto' } : undefined
  )
}

async function fetchCompletionResilientStreaming(
  request: OpenRouterStreamRequest,
  apiKey: string,
  body: Record<string, unknown>,
  send: SendEvent,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch,
  aiSdkExtras?: AiSdkStreamExtras
): Promise<CompletionResult> {
  let streamPrefixSafe = ''
  const captureSend: SendEvent = (event) => {
    if (event.type === 'text-delta') {
      streamPrefixSafe = event.text
    }
    send(event)
  }

  try {
    return await fetchCompletionStreaming(
      request,
      apiKey,
      body,
      captureSend,
      signal,
      fetchImpl,
      aiSdkExtras
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const maxTokens = body.max_tokens
    if (
      isCustomBackend(request) ||
      !isOpenRouterCreditError(message) ||
      typeof maxTokens !== 'number' ||
      maxTokens <= openRouterConfig.maxTokensCreditFallback
    ) {
      throw error
    }

    const retrySend: SendEvent = (event) => {
      if (event.type === 'text-delta' && streamPrefixSafe) {
        send({
          type: 'text-delta',
          delta: event.delta,
          text: mergeContinuationAnswer(streamPrefixSafe, event.text)
        })
        return
      }
      send(event)
    }

    const result = await fetchCompletionStreaming(
      request,
      apiKey,
      { ...body, max_tokens: openRouterConfig.maxTokensCreditFallback },
      retrySend,
      signal,
      fetchImpl,
      aiSdkExtras
    )

    if (!streamPrefixSafe) return result

    const mergedRaw = mergeContinuationAnswer(streamPrefixSafe, result.rawText)
    return toCompletionResult(mergedRaw, result.finishReason)
  }
}

function attachWebCapabilities(body: Record<string, unknown>, modelId: string): void {
  if (modelUsesNativeWebSearch(modelId)) {
    return
  }
  body.plugins = [{ id: 'web', max_results: 8 }]
}

async function completeWithWebSearch(
  request: OpenRouterStreamRequest,
  apiKey: string,
  body: Record<string, unknown>,
  send: SendEvent,
  lastUserMessage: string,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch
): Promise<void> {
  let result = await fetchCompletionResilientStreaming(
    request,
    apiKey,
    body,
    send,
    signal,
    fetchImpl
  )
  let text = result.text

  if (shouldRetryWebSearchAnswer(text, lastUserMessage, result.finishReason)) {
    const streamPrefix = result.streamSafeText
    const firstPassRaw = result.rawText
    const retryMessages = [
      ...(body.messages as Array<{ role: string; content: string | ChatMessagePayload['content'] }>),
      { role: 'assistant', content: text },
      {
        role: 'user',
        content: `Your answer was incomplete or too short. Answer this clearly in full sentences: "${lastUserMessage}"`
      }
    ]
    const continuation = await fetchCompletionResilientStreaming(
      request,
      apiKey,
      applyCompletionMaxTokens({ ...body, messages: retryMessages }, request, 'retry'),
      (event) => {
        if (event.type === 'text-delta') {
          send({
            type: 'text-delta',
            delta: event.delta,
            text: mergeContinuationAnswer(streamPrefix, event.text)
          })
          return
        }
        if (event.type === 'thinking-delta') {
          return
        }
        send(event)
      },
      signal,
      fetchImpl
    )
    text = toCompletionResult(
      mergeContinuationAnswer(firstPassRaw, continuation.rawText),
      continuation.finishReason
    ).text
  }

  if (!isSubstantiveReply(text, lastUserMessage) || looksTruncatedOrRefusal(text)) {
    throw new Error('The model returned an incomplete answer.')
  }

  send({ type: 'done', text })
}

async function completeWithLocalWebSearchViaAiSdkTool(
  request: OpenRouterStreamRequest,
  apiKey: string,
  userModelId: string,
  apiMessages: ChatMessagePayload[],
  practiceLanguage: string | undefined,
  lastUserMessage: string,
  send: SendEvent,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch
): Promise<void> {
  send({ type: 'searching' })

  const searchLocale = localeForPracticeLanguage(practiceLanguage)
  const searchQuery = optimizeWebSearchQuery(lastUserMessage)

  const emitTargets = (hits: Parameters<typeof mapResultsToSearchTargets>[0]) => {
    const targets = mapResultsToSearchTargets(hits)
    if (targets.length > 0) {
      send({ type: 'search-targets', targets })
    }
  }

  const tools = webSearchTools({
    locale: searchLocale,
    signal,
    onInitialResults: emitTargets,
    onVisitingUrl: (url) => send({ type: 'search-visiting', url })
  })

  const body = withCustomCompletionExtras(
    request,
    applyCompletionMaxTokens(
      {
        model: userModelId.trim(),
        messages: appendWebSearchToolHint(
          buildMessages(
            apiMessages,
            practiceLanguage,
            'research',
            isLanguagePracticeEnabled(request)
          ),
          searchQuery
        ),
        temperature: 0.3
      },
      request
    )
  )

  const { text } = await streamCompletionWithIncompleteRetry(
    request,
    apiKey,
    body,
    send,
    lastUserMessage,
    signal,
    fetchImpl,
    {
      requireSubstantive: true,
      aiSdkExtras: {
        tools,
        toolChoice: { type: 'tool', toolName: WEB_SEARCH_TOOL_NAME },
        maxToolSteps: 5
      }
    }
  )

  if (!isSubstantiveReply(text, lastUserMessage) || looksTruncatedOrRefusal(text)) {
    throw new Error('The model returned an incomplete answer.')
  }

  send({ type: 'done', text })
}

async function completeWithLocalWebSearch(
  request: OpenRouterStreamRequest,
  apiKey: string,
  userModelId: string,
  apiMessages: ChatMessagePayload[],
  practiceLanguage: string | undefined,
  lastUserMessage: string,
  send: SendEvent,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch,
  prefetchedResults?: LocalWebSearchResult[]
): Promise<void> {
  if (shouldUseAiSdkStreamForRequest(request) && prefetchedResults === undefined) {
    await completeWithLocalWebSearchViaAiSdkTool(
      request,
      apiKey,
      userModelId,
      apiMessages,
      practiceLanguage,
      lastUserMessage,
      send,
      signal,
      fetchImpl
    )
    return
  }

  const emitTargets = (hits: Parameters<typeof mapResultsToSearchTargets>[0]) => {
    const targets = mapResultsToSearchTargets(hits)
    if (targets.length > 0) {
      send({ type: 'search-targets', targets })
    }
  }

  const searchLocale = localeForPracticeLanguage(practiceLanguage)
  const searchQuery = optimizeWebSearchQuery(lastUserMessage)
  const results =
    prefetchedResults ??
    (await performLocalWebSearch(searchQuery, {
      locale: searchLocale,
      signal,
      onInitialResults: (hits) => emitTargets(hits),
      onVisitingUrl: (url) => send({ type: 'search-visiting', url })
    }))

  emitTargets(results)

  const augmented = substituteMessagesWithLocalWebSearchResults(
    apiMessages,
    lastUserMessage,
    results
  )
  const body = withCustomCompletionExtras(
    request,
    applyCompletionMaxTokens(
      {
        model: userModelId.trim(),
        messages: buildMessages(
          augmented,
          practiceLanguage,
          'research',
          isLanguagePracticeEnabled(request)
        ),
        temperature: 0.3
      },
      request
    )
  )

  const { text } = await streamCompletionWithIncompleteRetry(
    request,
    apiKey,
    body,
    send,
    lastUserMessage,
    signal,
    fetchImpl,
    { requireSubstantive: true }
  )

  if (!isSubstantiveReply(text, lastUserMessage) || looksTruncatedOrRefusal(text)) {
    throw new Error('The model returned an incomplete answer.')
  }

  send({ type: 'done', text })
}

async function tryNativeWebSearch(
  request: OpenRouterStreamRequest,
  apiKey: string,
  userModelId: string,
  apiMessages: ChatMessagePayload[],
  practiceLanguage: string | undefined,
  send: SendEvent,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch
): Promise<void> {
  const lastUserMessage = getLastUserMessageContent(apiMessages)

  const body = withCustomCompletionExtras(
    request,
    applyCompletionMaxTokens(
      {
        model: userModelId.trim(),
        messages: buildMessages(
          apiMessages,
          practiceLanguage,
          'research',
          isLanguagePracticeEnabled(request)
        ),
        temperature: 0.3
      },
      request
    )
  )

  attachWebCapabilities(body, userModelId)
  await completeWithWebSearch(request, apiKey, body, send, lastUserMessage, signal, fetchImpl)
}

async function completeOpenRouterWebSearchTurn(
  request: OpenRouterStreamRequest,
  apiKey: string,
  userModelId: string,
  apiMessages: ChatMessagePayload[],
  practiceLanguage: string | undefined,
  lastUserMessage: string,
  send: SendEvent,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch
): Promise<void> {
  const searchLocale = localeForPracticeLanguage(practiceLanguage)
  const searchQuery = optimizeWebSearchQuery(lastUserMessage)

  let localResults: LocalWebSearchResult[] = []
  let localFailed = false

  try {
    localResults = await performLocalWebSearch(searchQuery, {
      locale: searchLocale,
      signal,
      onInitialResults: (hits) => {
        const targets = mapResultsToSearchTargets(hits)
        if (targets.length > 0) send({ type: 'search-targets', targets })
      },
      onVisitingUrl: (url) => send({ type: 'search-visiting', url })
    })
  } catch (error) {
    if (signal?.aborted) throw error
    localFailed = true
  }

  if (!shouldTryExternalWebSearch(localResults, localFailed)) {
    await completeWithLocalWebSearch(
      request,
      apiKey,
      userModelId,
      apiMessages,
      practiceLanguage,
      lastUserMessage,
      send,
      signal,
      fetchImpl,
      localResults
    )
    return
  }

  try {
    await tryNativeWebSearch(
      request,
      apiKey,
      userModelId,
      apiMessages,
      practiceLanguage,
      send,
      signal,
      fetchImpl
    )
  } catch (externalError) {
    if (localResults.length > 0) {
      await completeWithLocalWebSearch(
        request,
        apiKey,
        userModelId,
        apiMessages,
        practiceLanguage,
        lastUserMessage,
        send,
        signal,
        fetchImpl,
        localResults
      )
      return
    }
    throw externalError
  }
}

function resolveTextPromptMode(
  request: OpenRouterStreamRequest,
  forceWebSearch: boolean,
  webSearchForTurn: boolean
): PromptMode {
  return resolveAgentPromptMode({
    languagePracticeEnabled: isLanguagePracticeEnabled(request),
    forceWebSearch,
    webSearchForTurn
  })
}

async function completeRegularTextChat(
  request: OpenRouterStreamRequest,
  apiKey: string,
  userModelId: string,
  apiMessages: ChatMessagePayload[],
  practiceLanguage: string | undefined,
  send: SendEvent,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch,
  forceWebSearch: boolean
): Promise<void> {
  const continuationPrefix = request.assistantContinuationPrefix?.trim()
  const researchMode = forceWebSearch
  const promptMode = resolveTextPromptMode(request, forceWebSearch, false)

  const body = withCustomCompletionExtras(
    request,
    applyCompletionMaxTokens(
      {
        model: userModelId.trim(),
        messages: buildMessages(
          apiMessages,
          practiceLanguage,
          promptMode,
          isLanguagePracticeEnabled(request)
        ),
        temperature: researchMode ? 0.3 : 0.7
      },
      request
    )
  )

  const lastUserMessage = getLastUserMessageContent(apiMessages)

  if (continuationPrefix) {
    const result = await streamAssistantContinuationOnly(
      request,
      apiKey,
      body,
      continuationPrefix,
      lastUserMessage,
      send,
      signal,
      fetchImpl
    )
    send({
      type: 'done',
      text: mergeContinuationAnswer(continuationPrefix, result.text)
    })
    return
  }

  const { text } = await streamCompletionWithIncompleteRetry(
    request,
    apiKey,
    body,
    send,
    lastUserMessage,
    signal,
    fetchImpl,
    { requireSubstantive: researchMode }
  )
  send({ type: 'done', text })
}

async function completeTextChat(
  request: OpenRouterStreamRequest,
  apiKey: string,
  userModelId: string,
  apiMessages: ChatMessagePayload[],
  practiceLanguage: string | undefined,
  send: SendEvent,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch
): Promise<void> {
  if (request.assistantContinuationPrefix?.trim()) {
    await completeRegularTextChat(
      request,
      apiKey,
      userModelId,
      apiMessages,
      practiceLanguage,
      send,
      signal,
      fetchImpl,
      false
    )
    return
  }

  const lastUserMessage = getLastUserMessageContent(apiMessages)
  const { webSearchForTurn, forceWebSearch, blockedByAttachments } =
    resolveWebSearchForStreamTurn(request, apiMessages, lastUserMessage)

  if (blockedByAttachments) {
    await completeRegularTextChat(
      request,
      apiKey,
      userModelId,
      apiMessages,
      practiceLanguage,
      send,
      signal,
      fetchImpl,
      false
    )
    return
  }

  if (webSearchForTurn || forceWebSearch) {
    send({ type: 'searching' })

    // Custom endpoints do not support provider-native web tools, so their
    // "web search on" path should behave like OpenRouter's local fallback.
    if (isCustomBackend(request)) {
      try {
        await completeWithLocalWebSearch(
          request,
          apiKey,
          userModelId,
          apiMessages,
          practiceLanguage,
          lastUserMessage,
          send,
          signal,
          fetchImpl
        )
        return
      } catch (error) {
        if (signal?.aborted) throw error
        if (!isLocalWebSearchFailure(error)) throw error
        send({ type: 'search-fallback', message: SEARCH_FALLBACK_NOTICE })
        await completeRegularTextChat(
          request,
          apiKey,
          userModelId,
          apiMessages,
          practiceLanguage,
          send,
          signal,
          fetchImpl,
          forceWebSearch
        )
        return
      }
    }

    if (isLocalWebSearchRegistered()) {
      await completeOpenRouterWebSearchTurn(
        request,
        apiKey,
        userModelId,
        apiMessages,
        practiceLanguage,
        lastUserMessage,
        send,
        signal,
        fetchImpl
      )
      return
    }

    try {
      await tryNativeWebSearch(
        request,
        apiKey,
        userModelId,
        apiMessages,
        practiceLanguage,
        send,
        signal,
        fetchImpl
      )
      return
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const canFallback =
        isWebSearchApiError(message) || isWebSearchResultFailure(message)

      if (!canFallback) throw error

      await completeWithLocalWebSearch(
        request,
        apiKey,
        userModelId,
        apiMessages,
        practiceLanguage,
        lastUserMessage,
        send,
        signal,
        fetchImpl
      )
      return
    }
  }

  await completeRegularTextChat(
    request,
    apiKey,
    userModelId,
    apiMessages,
    practiceLanguage,
    send,
    signal,
    fetchImpl,
    forceWebSearch
  )
}

export async function streamOpenRouterChat(
  request: OpenRouterStreamRequest,
  send: SendEvent,
  getApiKey: () => Promise<string | null>,
  options?: OpenRouterStreamOptions,
  signal?: AbortSignal
): Promise<void> {
  const fetchImpl = options?.fetchImpl ?? fetch
  const apiKey = (await getApiKey()) ?? ''
  const custom = isCustomBackend(request)
  if (!apiKey.trim() && !custom) {
    throw new Error('NO_OPENROUTER_KEY')
  }
  if (
    custom &&
    !apiKey.trim() &&
    customEndpointRequiresApiKey(request.customLlm?.baseUrl ?? '')
  ) {
    throw new Error('NO_CUSTOM_LLM_KEY')
  }
  const primaryModelId = custom
    ? (request.customLlm?.model ?? request.model ?? '').trim()
    : (request.model ?? options?.defaultModel ?? openRouterConfig.defaultModel)
  if (!primaryModelId) throw new Error('Model id is not configured.')

  const modelAutoFallback = !custom && request.modelAutoFallback === true

  await runWithModelFallback(primaryModelId, modelAutoFallback, async (tryModelId) => {
    let apiMessages = request.messages
    let hasImages = messagesHaveImages(apiMessages)

    if (hasImages && !isVisionCapableModel(tryModelId)) {
      apiMessages = await substituteMessagesWithOcr(apiMessages)
      hasImages = false
    }

    if (hasImages && isVisionCapableModel(tryModelId)) {
      const body = withCustomCompletionExtras(
        request,
        applyCompletionMaxTokens(
          {
            model: tryModelId.trim(),
            messages: buildMessages(
              apiMessages,
              request.practiceLanguage,
              'vision',
              isLanguagePracticeEnabled(request)
            ),
            temperature: 0.7
          },
          request
        )
      )

      try {
        const lastUserMessage = getLastUserMessageContent(apiMessages)
        const { text } = await streamCompletionWithIncompleteRetry(
          request,
          apiKey,
          body,
          send,
          lastUserMessage,
          signal,
          fetchImpl,
          { requireSubstantive: true }
        )
        send({ type: 'done', text })
        return
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (!isVisionApiError(message)) throw error
        apiMessages = await substituteMessagesWithOcr(apiMessages)
        hasImages = false
      }
    }

    if (hasImages) {
      apiMessages = await substituteMessagesWithOcr(apiMessages)
    }

    await completeTextChat(
      request,
      apiKey,
      tryModelId,
      apiMessages,
      request.practiceLanguage,
      send,
      signal,
      fetchImpl
    )
  })
}
