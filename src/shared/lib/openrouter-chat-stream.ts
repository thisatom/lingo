import type { ChatMessagePayload, ChatStreamEvent } from '@/shared/types/ipc'
import { openRouterConfig } from '@/shared/config/openrouter'
import {
  getLastUserMessageContent,
  isSubstantiveReply,
  looksTruncatedOrRefusal,
  shouldForceWebSearch,
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
import {
  isWebSearchApiError,
  isWebSearchResultFailure,
  substituteMessagesWithLocalWebSearch
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
  webSearch?: boolean
  modelAutoFallback?: boolean
}

export type OpenRouterStreamOptions = {
  defaultModel?: string
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
Respond in ${lang}. Keep replies concise (2–4 sentences), gently correct mistakes, ask a follow-up when appropriate.${ocrNote}`
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
  return messages.filter((m) => {
    if (m.role === 'system') return false
    if (researchMode && m.role === 'assistant' && assistantTextLength(m.content) < 48) {
      return false
    }
    return payloadHasContent(m.content)
  })
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
  return errText || `OpenRouter request failed (${status})`
}

async function fetchCompletion(
  apiKey: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<CompletionResult> {
  const response = await fetch(`${openRouterConfig.baseURL}/chat/completions`, {
    method: 'POST',
    headers: openRouterHeaders(apiKey),
    body: JSON.stringify({ ...body, stream: false }),
    signal
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(formatOpenRouterError(parseApiError(errText, response.status)))
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string | Array<{ type?: string; text?: string }> }
      finish_reason?: string | null
    }>
    error?: { message?: string }
  }

  if (data.error?.message) {
    throw new Error(formatOpenRouterError(data.error.message))
  }

  const choice = data.choices?.[0]
  const text = extractAssistantText(choice?.message ?? {})
  if (!text.trim()) {
    throw new Error('Model returned an empty response')
  }

  return { text, finishReason: choice?.finish_reason ?? null }
}

async function fetchCompletionResilient(
  apiKey: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<CompletionResult> {
  try {
    return await fetchCompletion(apiKey, body, signal)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const maxTokens = body.max_tokens
    if (
      !isOpenRouterCreditError(message) ||
      typeof maxTokens !== 'number' ||
      maxTokens <= openRouterConfig.maxTokensCreditFallback
    ) {
      throw error
    }
    return fetchCompletion(
      apiKey,
      { ...body, max_tokens: openRouterConfig.maxTokensCreditFallback },
      signal
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
  apiKey: string,
  body: Record<string, unknown>,
  send: SendEvent,
  lastUserMessage: string,
  signal?: AbortSignal
): Promise<void> {
  let result = await fetchCompletionResilient(apiKey, body, signal)
  let text = result.text

  const needsRetry =
    !isSubstantiveReply(text, lastUserMessage) ||
    looksTruncatedOrRefusal(text) ||
    result.finishReason === 'length'

  if (needsRetry) {
    const retryMessages = [
      ...(body.messages as Array<{ role: string; content: string | ChatMessagePayload['content'] }>),
      { role: 'assistant', content: text },
      {
        role: 'user',
        content: `Your answer was incomplete or too short. Answer this clearly in full sentences: "${lastUserMessage}"`
      }
    ]
    result = await fetchCompletionResilient(
      apiKey,
      { ...body, messages: retryMessages, max_tokens: openRouterConfig.maxTokensRetry },
      signal
    )
    text = result.text
  }

  if (!isSubstantiveReply(text, lastUserMessage) || looksTruncatedOrRefusal(text)) {
    throw new Error('The model returned an incomplete answer.')
  }

  send({ type: 'text-delta', delta: text, text })
  send({ type: 'done', text })
}

async function completeWithLocalWebSearch(
  apiKey: string,
  userModelId: string,
  apiMessages: ChatMessagePayload[],
  practiceLanguage: string | undefined,
  lastUserMessage: string,
  send: SendEvent,
  signal?: AbortSignal
): Promise<void> {
  const augmented = await substituteMessagesWithLocalWebSearch(apiMessages, lastUserMessage)
  const body: Record<string, unknown> = {
    model: userModelId.trim(),
    messages: buildMessages(augmented, practiceLanguage, 'research'),
    max_tokens: openRouterConfig.maxTokens,
    temperature: 0.3
  }

  const { text } = await fetchCompletionResilient(apiKey, body, signal)
  send({ type: 'text-delta', delta: text, text })
  send({ type: 'done', text })
}

async function tryNativeWebSearch(
  apiKey: string,
  userModelId: string,
  apiMessages: ChatMessagePayload[],
  practiceLanguage: string | undefined,
  send: SendEvent,
  signal?: AbortSignal
): Promise<void> {
  const lastUserMessage = getLastUserMessageContent(apiMessages)
  const researchMode =
    shouldForceWebSearch(lastUserMessage) || shouldUseResearchMode(lastUserMessage)

  const body: Record<string, unknown> = {
    model: userModelId.trim(),
    messages: buildMessages(apiMessages, practiceLanguage, researchMode ? 'research' : 'practice'),
    max_tokens: openRouterConfig.maxTokens,
    temperature: researchMode ? 0.3 : 0.7
  }

  attachWebCapabilities(body, userModelId)
  await completeWithWebSearch(apiKey, body, send, lastUserMessage, signal)
}

async function completeTextChat(
  apiKey: string,
  userModelId: string,
  apiMessages: ChatMessagePayload[],
  practiceLanguage: string | undefined,
  webSearchRequested: boolean,
  send: SendEvent,
  signal?: AbortSignal
): Promise<void> {
  const lastUserMessage = getLastUserMessageContent(apiMessages)
  const webSearchEnabled = webSearchRequested && !messagesHaveImages(apiMessages)

  if (webSearchEnabled) {
    send({ type: 'searching' })

    if (isLocalWebSearchRegistered()) {
      await completeWithLocalWebSearch(
        apiKey,
        userModelId,
        apiMessages,
        practiceLanguage,
        lastUserMessage,
        send,
        signal
      )
      return
    }

    try {
      await tryNativeWebSearch(
        apiKey,
        userModelId,
        apiMessages,
        practiceLanguage,
        send,
        signal
      )
      return
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const canFallback =
        isWebSearchApiError(message) || isWebSearchResultFailure(message)

      if (!canFallback) throw error

      await completeWithLocalWebSearch(
        apiKey,
        userModelId,
        apiMessages,
        practiceLanguage,
        lastUserMessage,
        send,
        signal
      )
      return
    }
  }

  const researchMode =
    shouldForceWebSearch(lastUserMessage) || shouldUseResearchMode(lastUserMessage)
  const promptMode: PromptMode = researchMode ? 'research' : 'practice'

  const body: Record<string, unknown> = {
    model: userModelId.trim(),
    messages: buildMessages(apiMessages, practiceLanguage, promptMode),
    max_tokens: openRouterConfig.maxTokens,
    temperature: researchMode ? 0.3 : 0.7
  }

  const { text } = await fetchCompletionResilient(apiKey, body, signal)
  send({ type: 'text-delta', delta: text, text })
  send({ type: 'done', text })
}

export async function streamOpenRouterChat(
  request: OpenRouterStreamRequest,
  send: SendEvent,
  getApiKey: () => Promise<string | null>,
  options?: OpenRouterStreamOptions,
  signal?: AbortSignal
): Promise<void> {
  const apiKey = await getApiKey()
  if (!apiKey) throw new Error('NO_OPENROUTER_KEY')

  const primaryModelId = request.model ?? options?.defaultModel ?? openRouterConfig.defaultModel
  const webSearchRequested = request.webSearch !== false
  const modelAutoFallback = request.modelAutoFallback === true

  await runWithModelFallback(primaryModelId, modelAutoFallback, async (tryModelId) => {
    let apiMessages = request.messages
    let hasImages = messagesHaveImages(apiMessages)

    if (hasImages && !isVisionCapableModel(tryModelId)) {
      apiMessages = await substituteMessagesWithOcr(apiMessages)
      hasImages = false
    }

    if (hasImages && isVisionCapableModel(tryModelId)) {
      const body: Record<string, unknown> = {
        model: tryModelId.trim(),
        messages: buildMessages(apiMessages, request.practiceLanguage, 'vision'),
        max_tokens: openRouterConfig.maxTokens,
        temperature: 0.7
      }

      try {
        const { text } = await fetchCompletionResilient(apiKey, body, signal)
        send({ type: 'text-delta', delta: text, text })
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
      apiKey,
      tryModelId,
      apiMessages,
      request.practiceLanguage,
      webSearchRequested,
      send,
      signal
    )
  })
}
