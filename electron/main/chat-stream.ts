import type { ChatMessagePayload, ChatStreamEvent } from '../../src/shared/types/ipc'
import {
  getLastUserMessageContent,
  isSubstantiveReply,
  looksTruncatedOrRefusal,
  shouldForceWebSearch,
  shouldUseResearchMode
} from '../../src/shared/lib/web-search-intent'
import { openRouterConfig } from '../../src/shared/config/openrouter'
import {
  formatOpenRouterError,
  isOpenRouterCreditError
} from '../../src/shared/lib/openrouter-errors'
import { getSecret } from './secrets'
import {
  extractAssistantText,
  resolveWebSearchModel
} from './openrouter-request'

export { normalizeOpenRouterModelId } from '../../src/shared/config/openrouter'

type SendEvent = (event: ChatStreamEvent) => void
type PromptMode = 'research' | 'practice'

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

  if (mode === 'research') {
    return `You are Lingo, a helpful AI assistant with live web search.
${today}
Answer in the same language the user writes in (often ${lang}).
Rules:
- Answer the user's question directly and completely (at least 2–4 sentences for factual questions).
- Use web search when you need current or factual information beyond today's date.
- Include markdown links to sources when search results are used.
- NEVER stop mid-sentence. NEVER reply with only a few words unless asked.
- If the user asks the current year or date, state it clearly from today's date above.`
  }

  return `You are Lingo, a friendly language practice partner. The user practices conversational ${lang}.
${today}
Respond in ${lang}. Keep replies concise (2–4 sentences), gently correct mistakes, ask a follow-up when appropriate.`
}

function filterHistoryForApi(
  messages: ChatMessagePayload[],
  researchMode: boolean
): ChatMessagePayload[] {
  return messages.filter((m) => {
    if (m.role === 'system') return false
    if (researchMode && m.role === 'assistant' && m.content.trim().length < 48) {
      return false
    }
    return m.content.trim().length > 0
  })
}

function buildMessages(
  messages: ChatMessagePayload[],
  practiceLanguage: string | undefined,
  mode: PromptMode
): Array<{ role: string; content: string }> {
  const researchMode = mode === 'research'
  return [
    { role: 'system', content: systemPrompt(practiceLanguage, mode) },
    ...filterHistoryForApi(messages, researchMode).map((m) => ({
      role: m.role,
      content: m.content
    }))
  ]
}

function openRouterHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.LINGO_APP_URL ?? 'https://github.com/lingo-app',
    'X-Title': process.env.LINGO_APP_NAME ?? 'Lingo'
  }
}

function modelUsesNativeWebSearch(modelId: string): boolean {
  const id = modelId.toLowerCase()
  return id.startsWith('perplexity/') || id.includes(':online')
}

type CompletionResult = { text: string; finishReason: string | null }

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

function parseApiError(errText: string, status: number): string {
  try {
    const parsed = JSON.parse(errText) as { error?: { message?: string } }
    if (parsed.error?.message) return parsed.error.message
  } catch {
    // ignore
  }
  return errText || `OpenRouter request failed (${status})`
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

function attachWebCapabilities(
  body: Record<string, unknown>,
  modelId: string
): void {
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
  send({ type: 'searching' })

  let result = await fetchCompletionResilient(apiKey, body, signal)
  let text = result.text

  const needsRetry =
    !isSubstantiveReply(text, lastUserMessage) ||
    looksTruncatedOrRefusal(text) ||
    result.finishReason === 'length'

  if (needsRetry) {
    const retryMessages = [
      ...(body.messages as Array<{ role: string; content: string }>),
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
    throw new Error(
      'The model returned an incomplete answer. Create a new chat or set model to perplexity/sonar in Settings.'
    )
  }

  send({ type: 'text-delta', delta: text, text })
  send({ type: 'done', text })
}

export async function streamChat(
  request: {
    messages: ChatMessagePayload[]
    model?: string
    practiceLanguage?: string
    webSearch?: boolean
  },
  send: SendEvent,
  signal?: AbortSignal
): Promise<void> {
  const apiKey = await getSecret('openrouter')
  if (!apiKey) throw new Error('NO_OPENROUTER_KEY')

  const userModelId =
    request.model ?? process.env.LINGO_OPENROUTER_MODEL ?? openRouterConfig.defaultModel
  const webSearchEnabled = request.webSearch !== false
  const lastUserMessage = getLastUserMessageContent(request.messages)
  const researchMode =
    webSearchEnabled &&
    (shouldForceWebSearch(lastUserMessage) || shouldUseResearchMode(lastUserMessage))

  const resolvedModel = webSearchEnabled
    ? resolveWebSearchModel(userModelId)
    : userModelId.trim()

  const body: Record<string, unknown> = {
    model: resolvedModel,
    messages: buildMessages(
      request.messages,
      request.practiceLanguage,
      researchMode ? 'research' : 'practice'
    ),
    max_tokens: openRouterConfig.maxTokens,
    temperature: researchMode ? 0.3 : 0.7
  }

  if (webSearchEnabled) {
    attachWebCapabilities(body, resolvedModel)
    await completeWithWebSearch(apiKey, body, send, lastUserMessage, signal)
    return
  }

  const { text } = await fetchCompletionResilient(apiKey, body, signal)
  send({ type: 'text-delta', delta: text, text })
  send({ type: 'done', text })
}
