import type {
  ChatMessagePayload,
  ChatStreamEvent,
  CustomLlmConfig,
  LlmBackend
} from '@/shared/types/ipc'
import { resolveChatCompletionsUrl } from '@/shared/config/custom-llm'
import { customLlmConfig } from '@/shared/config/custom-llm'
import { openRouterConfig } from '@/shared/config/openrouter'
import { normalizeAlternatingChatPayloads } from '@/shared/lib/chat-api-alternation'
import { mergeCustomCompletionBody } from '@/shared/lib/custom-llm-profile'
import { assertOutboundHttpUrl } from '@/shared/lib/outbound-url-policy'
import { openaiCompatibleHeaders } from '@/shared/lib/openai-compatible-headers'
import {
  buildCompletionRetryUserMessage,
  shouldRetryIncompleteCompletion
} from '@/shared/lib/completion-quality'
import {
  getLastUserMessageContent,
  isSubstantiveReply,
  looksTruncatedOrRefusal,
  shouldForceWebSearch,
  shouldRetryWebSearchAnswer,
  shouldRunWebSearch,
  shouldUseResearchMode
} from '@/shared/lib/web-search-intent'
import {
  formatOpenRouterError,
  isOpenRouterCreditError
} from '@/shared/lib/openrouter-errors'
import { openRouterHeaders } from '@/shared/lib/openrouter-headers'
import { extractAssistantText } from '@/shared/lib/openrouter-model'
import {
  isLocalWebSearchRegistered
} from '@/shared/lib/local-web-search-runtime'
import { getWebSearchProvider } from '@/shared/lib/web-search-provider'
import {
  fetchLocalWebSearchResults,
  isWebSearchApiError,
  isWebSearchResultFailure,
  substituteMessagesWithLocalWebSearchResults
} from '@/shared/lib/web-search-messages'
import {
  isVisionApiError,
  substituteMessagesWithOcr
} from '@/shared/lib/image-ocr-messages'
import { runWithModelFallback } from '@/shared/lib/openrouter-model-fallback'
import { isVisionCapableModel, messagesHaveImages } from '@/shared/lib/vision-models'

export { normalizeOpenRouterModelId } from '@/shared/config/openrouter'

type SendEvent = (event: ChatStreamEvent) => void
type PromptMode = 'research' | 'practice' | 'vision'

export type OpenRouterStreamRequest = {
  messages: ChatMessagePayload[]
  model?: string
  practiceLanguage?: string
  llmBackend?: LlmBackend
  customLlm?: CustomLlmConfig
  webSearch?: boolean
  modelAutoFallback?: boolean
  maxTokens?: number
  maxTokensRetry?: number
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

function maxTokensBudget(request: OpenRouterStreamRequest): number {
  if (typeof request.maxTokens === 'number') return request.maxTokens
  return isCustomBackend(request) ? customLlmConfig.maxTokens : openRouterConfig.maxTokens
}

function maxTokensRetryBudget(request: OpenRouterStreamRequest): number {
  if (typeof request.maxTokensRetry === 'number') return request.maxTokensRetry
  return isCustomBackend(request) ? customLlmConfig.maxTokensRetry : openRouterConfig.maxTokensRetry
}

function withCustomCompletionExtras(
  request: OpenRouterStreamRequest,
  body: Record<string, unknown>
): Record<string, unknown> {
  if (!isCustomBackend(request)) return body
  return mergeCustomCompletionBody(body, request.customLlm?.completionExtras)
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

function formatTodayLine(): string {
  const now = new Date()
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  return `Today is ${date} (year ${now.getFullYear()}). Use this for date/year questions.`
}

function systemPrompt(practiceLanguage: string | undefined, mode: PromptMode): string {
  const lang = practiceLanguage ?? 'en'
  const today = formatTodayLine()
  const ocrNote =
    ' Image attachments may appear as **Text extracted from image (OCR)** blocks — treat that as the image content.'
  const localSearchNote =
    ' Messages may include **Web search results (local)** blocks — treat them as live web search results and cite linked sources.'

  if (mode === 'vision') {
    return `You are Lingo, a helpful AI assistant with vision.
${today}
The user can attach images to messages. You receive those images in the conversation and CAN see them.
Rules:
- Describe, analyze, compare, and answer questions about attached images (objects, scenes, diagrams, screenshots, handwriting).
- Read visible text in images when asked (OCR-style).
- Answer in the same language the user writes in (often ${lang}).
- If the user sends only an image, describe what you see and offer relevant help.
- For language practice with images, you may still correct mistakes and ask follow-ups, but prioritize visual questions first.
- NEVER claim you cannot see images when they are attached in this thread.`
  }

  if (mode === 'research') {
    return `You are Lingo, a helpful AI assistant with live web search.
${today}
Answer in the same language the user writes in (often ${lang}).
Rules:
- Answer the user's question directly and completely (at least 2–4 sentences for factual questions).
- Use web search when you need current or factual information beyond today's date.
- Include markdown links to sources when search results are used.
- NEVER stop mid-sentence. NEVER reply with only a few words unless asked.
- If the user asks the current year or date, state it clearly from today's date above.${ocrNote}${localSearchNote}`
  }

  return `You are Lingo, a friendly language practice partner. The user practices conversational ${lang}.
${today}
Respond in ${lang}. Match the user's intent: short drills can be brief; explanations and stories should be as long as needed.
Rules:
- Finish every reply completely; never stop mid-sentence.
- Stay consistent with the conversation above; if something is unclear, ask one short clarifying question.
- Gently correct mistakes when relevant; ask a follow-up when it helps practice.${ocrNote}`
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
  mode: PromptMode
): Array<{ role: string; content: string | ChatMessagePayload['content'] }> {
  const researchMode = mode === 'research'
  return [
    { role: 'system', content: systemPrompt(practiceLanguage, mode) },
    ...filterHistoryForApi(messages, researchMode).map((m) => ({
      role: m.role,
      content: m.content
    }))
  ]
}

function modelUsesNativeWebSearch(modelId: string): boolean {
  const id = modelId.toLowerCase()
  return id.startsWith('perplexity/') || id.includes(':online')
}

type CompletionResult = { text: string; finishReason: string | null }

function parseApiError(errText: string, status: number): string {
  try {
    const parsed = JSON.parse(errText) as { error?: { message?: string } }
    if (parsed.error?.message) return parsed.error.message
  } catch {
    // ignore
  }
  return errText || `API request failed (${status})`
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
    const message = parseApiError(errText, response.status)
    throw new Error(isCustomBackend(request) ? message : formatOpenRouterError(message))
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
  const text = extractAssistantText(choice?.message ?? {})
  if (!text.trim()) {
    throw new Error('Model returned an empty response')
  }

  return { text, finishReason: choice?.finish_reason ?? null }
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

type SseChunk = {
  choices?: Array<{
    delta?: StreamDelta
    message?: StreamMessage
    finish_reason?: string | null
  }>
  error?: { message?: string }
}

function extractStreamDelta(chunk: SseChunk): string {
  return extractAssistantText(chunk.choices?.[0]?.delta ?? {})
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

function extractStreamReasoning(chunk: SseChunk): string {
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

async function fetchCompletionStreaming(
  request: OpenRouterStreamRequest,
  apiKey: string,
  body: Record<string, unknown>,
  send: SendEvent,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch
): Promise<CompletionResult> {
  const merged = withCustomCompletionExtras(request, { ...body, stream: true })
  if (merged.stream === false) {
    const result = await fetchCompletion(request, apiKey, body, signal, fetchImpl)
    send({ type: 'text-delta', delta: result.text, text: result.text })
    return result
  }

  const url = chatCompletionsUrl(request)
  if (!url) throw new Error('Custom API base URL is not configured.')

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: requestHeaders(request, apiKey),
    body: JSON.stringify(merged),
    signal
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    const message = parseApiError(errText, response.status)
    throw new Error(isCustomBackend(request) ? message : formatOpenRouterError(message))
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Streaming response has no body')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
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
        const message = chunk.error.message
        throw new Error(isCustomBackend(request) ? message : formatOpenRouterError(message))
      }

      const reasoning = extractStreamReasoning(chunk)
      if (reasoning) {
        thinkingText += reasoning
        send({ type: 'thinking-delta', delta: reasoning, text: thinkingText })
      }

      const delta = extractStreamDelta(chunk)
      if (delta) {
        text += delta
        send({ type: 'text-delta', delta, text })
      }

      const fr = chunk.choices?.[0]?.finish_reason
      if (fr) finishReason = fr
    }
  }

  if (!text.trim() && !thinkingText.trim()) {
    throw new Error('Model returned an empty response')
  }

  return { text, finishReason }
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
  options: { requireSubstantive: boolean }
): Promise<CompletionResult> {
  let result = await fetchCompletionResilientStreaming(
    request,
    apiKey,
    body,
    send,
    signal,
    fetchImpl
  )

  if (
    !shouldRetryIncompleteCompletion({
      answer: result.text,
      finishReason: result.finishReason,
      userMessage: lastUserMessage,
      requireSubstantive: options.requireSubstantive
    })
  ) {
    return result
  }

  const retryMessages: ChatCompletionMessage[] = [
    ...(body.messages as ChatCompletionMessage[]),
    { role: 'assistant', content: result.text },
    { role: 'user', content: buildCompletionRetryUserMessage(lastUserMessage) }
  ]

  return fetchCompletionResilientStreaming(
    request,
    apiKey,
    { ...body, messages: retryMessages, max_tokens: maxTokensRetryBudget(request) },
    send,
    signal,
    fetchImpl
  )
}

async function fetchCompletionResilientStreaming(
  request: OpenRouterStreamRequest,
  apiKey: string,
  body: Record<string, unknown>,
  send: SendEvent,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch
): Promise<CompletionResult> {
  try {
    return await fetchCompletionStreaming(request, apiKey, body, send, signal, fetchImpl)
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
    return fetchCompletionStreaming(
      request,
      apiKey,
      { ...body, max_tokens: openRouterConfig.maxTokensCreditFallback },
      send,
      signal,
      fetchImpl
    )
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
    const retryMessages = [
      ...(body.messages as Array<{ role: string; content: string | ChatMessagePayload['content'] }>),
      { role: 'assistant', content: text },
      {
        role: 'user',
        content: `Your answer was incomplete or too short. Answer this clearly in full sentences: "${lastUserMessage}"`
      }
    ]
    result = await fetchCompletionResilientStreaming(
      request,
      apiKey,
      { ...body, messages: retryMessages, max_tokens: maxTokensRetryBudget(request) },
      send,
      signal,
      fetchImpl
    )
    text = result.text
  }

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
  fetchImpl: OpenRouterFetch
): Promise<void> {
  const results = await fetchLocalWebSearchResults(lastUserMessage)
  const targets = results
    .filter((result) => result.url || result.title)
    .map((result) => ({
      title: result.title.trim() || result.url,
      url: result.url
    }))
  if (targets.length > 0) {
    send({ type: 'search-targets', targets })
  }

  const augmented = substituteMessagesWithLocalWebSearchResults(
    apiMessages,
    lastUserMessage,
    results
  )
  const body = withCustomCompletionExtras(request, {
    model: userModelId.trim(),
    messages: buildMessages(augmented, practiceLanguage, 'research'),
    max_tokens: maxTokensBudget(request),
    temperature: 0.3
  })

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
  const researchMode =
    shouldForceWebSearch(lastUserMessage) || shouldUseResearchMode(lastUserMessage)

  const body = withCustomCompletionExtras(request, {
    model: userModelId.trim(),
    messages: buildMessages(apiMessages, practiceLanguage, researchMode ? 'research' : 'practice'),
    max_tokens: maxTokensBudget(request),
    temperature: researchMode ? 0.3 : 0.7
  })

  attachWebCapabilities(body, userModelId)
  const provider = getWebSearchProvider(userModelId, { local: false })
  send({
    type: 'search-targets',
    targets: [{ title: provider.label, url: provider.href }]
  })
  await completeWithWebSearch(request, apiKey, body, send, lastUserMessage, signal, fetchImpl)
}

async function completeTextChat(
  request: OpenRouterStreamRequest,
  apiKey: string,
  userModelId: string,
  apiMessages: ChatMessagePayload[],
  practiceLanguage: string | undefined,
  webSearchRequested: boolean,
  send: SendEvent,
  signal: AbortSignal | undefined,
  fetchImpl: OpenRouterFetch
): Promise<void> {
  const lastUserMessage = getLastUserMessageContent(apiMessages)
  const webSearchEnabled =
    !isCustomBackend(request) &&
    webSearchRequested &&
    !messagesHaveImages(apiMessages) &&
    shouldRunWebSearch(lastUserMessage)

  if (webSearchEnabled) {
    send({ type: 'searching' })

    if (isLocalWebSearchRegistered()) {
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

  const researchMode =
    !isCustomBackend(request) &&
    (shouldForceWebSearch(lastUserMessage) || shouldUseResearchMode(lastUserMessage))
  const promptMode: PromptMode = researchMode ? 'research' : 'practice'

  const body = withCustomCompletionExtras(request, {
    model: userModelId.trim(),
    messages: buildMessages(apiMessages, practiceLanguage, promptMode),
    max_tokens: maxTokensBudget(request),
    temperature: researchMode ? 0.3 : 0.7
  })

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

export async function streamOpenRouterChat(
  request: OpenRouterStreamRequest,
  send: SendEvent,
  getApiKey: () => Promise<string | null>,
  options?: OpenRouterStreamOptions,
  signal?: AbortSignal
): Promise<void> {
  const fetchImpl = options?.fetchImpl ?? fetch
  const apiKey = (await getApiKey()) ?? ''
  if (!apiKey.trim() && !isCustomBackend(request)) {
    throw new Error('NO_OPENROUTER_KEY')
  }

  const custom = isCustomBackend(request)
  const primaryModelId = custom
    ? (request.customLlm?.model ?? request.model ?? '').trim()
    : (request.model ?? options?.defaultModel ?? openRouterConfig.defaultModel)
  if (!primaryModelId) throw new Error('Model id is not configured.')

  const webSearchRequested = request.webSearch !== false
  const modelAutoFallback = !custom && request.modelAutoFallback === true

  await runWithModelFallback(primaryModelId, modelAutoFallback, async (tryModelId) => {
    let apiMessages = request.messages
    let hasImages = messagesHaveImages(apiMessages)

    if (hasImages && !isVisionCapableModel(tryModelId)) {
      apiMessages = await substituteMessagesWithOcr(apiMessages)
      hasImages = false
    }

    if (hasImages && isVisionCapableModel(tryModelId)) {
      const body = withCustomCompletionExtras(request, {
        model: tryModelId.trim(),
        messages: buildMessages(apiMessages, request.practiceLanguage, 'vision'),
        max_tokens: maxTokensBudget(request),
        temperature: 0.7
      })

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
      webSearchRequested,
      send,
      signal,
      fetchImpl
    )
  })
}
