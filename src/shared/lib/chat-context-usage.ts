import { normalizeOpenRouterModelId, openRouterConfig } from '@/shared/config/openrouter'
import {
  isLlmMaxTokensUnlimited,
  LLM_MAX_TOKENS_DEFAULT,
  LLM_MAX_TOKENS_MAX,
  LLM_MAX_TOKENS_MIN,
  normalizeLlmMaxTokens
} from '@/shared/lib/llm-max-tokens'
import type { Message } from '@/entities/message/model/types'

const MESSAGE_OVERHEAD_TOKENS = 4
const SYSTEM_PROMPT_RESERVE = 384
const CONTEXT_SAFETY_MARGIN = 0.05
const DEFAULT_CONTEXT_LIMIT = 32_000

/** Approximate context window sizes (tokens) for common OpenRouter models. */
const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  'openai/gpt-4o-mini': 128_000,
  'openai/gpt-4o': 128_000,
  'openai/gpt-4.1-mini': 128_000,
  'openai/gpt-4.1': 128_000,
  'anthropic/claude-3.5-sonnet': 200_000,
  'anthropic/claude-3.7-sonnet': 200_000,
  'anthropic/claude-sonnet-4': 200_000,
  'google/gemini-2.0-flash-001': 1_000_000,
  'google/gemini-2.5-flash-preview': 1_000_000,
  'meta-llama/llama-3.3-70b-instruct': 128_000,
  'mistralai/mistral-small-3.1-24b-instruct': 128_000,
  'deepseek/deepseek-chat': 64_000,
  'qwen/qwen-2.5-72b-instruct': 128_000,
  'openrouter/free': 128_000,
  'openrouter/auto': 128_000,
  'nvidia/nemotron-3-super-120b-a12b:free': 256_000,
  'meta-llama/llama-3.3-70b-instruct:free': 128_000,
  'google/gemma-3-27b-it:free': 128_000,
  'test/tiny-context': 4_000
}

export function getModelContextLimit(modelId: string): number {
  const key = normalizeOpenRouterModelId(modelId).toLowerCase()
  return MODEL_CONTEXT_LIMITS[key] ?? DEFAULT_CONTEXT_LIMIT
}

/** Token reserve for context meter / trimming when reply cap is unlimited. */
export function resolveOutputTokenReserve(modelId: string, llmMaxTokens: number): number {
  if (isLlmMaxTokensUnlimited(llmMaxTokens)) {
    const limit = getModelContextLimit(modelId)
    return Math.min(
      LLM_MAX_TOKENS_MAX,
      Math.max(LLM_MAX_TOKENS_MIN, Math.floor(limit * 0.5))
    )
  }
  return normalizeLlmMaxTokens(llmMaxTokens)
}

export function estimateTextTokens(text: string): number {
  if (!text.trim()) return 0
  return Math.ceil(text.length / 3.5)
}

export function estimateChatContextTokens(
  messages: readonly Pick<Message, 'role' | 'content'>[]
): number {
  const forApi = messages.filter((m) => m.role !== 'thinking')
  return (
    SYSTEM_PROMPT_RESERVE +
    forApi.reduce(
      (sum, message) =>
        sum + MESSAGE_OVERHEAD_TOKENS + estimateTextTokens(message.content),
      0
    )
  )
}

export function getChatContextUsagePercent(
  messages: readonly Pick<Message, 'role' | 'content'>[],
  modelId: string,
  reservedOutputTokens: number = LLM_MAX_TOKENS_DEFAULT
): number {
  return getChatContextUsageDetails(messages, modelId, reservedOutputTokens).percent
}

export type ChatContextUsageDetails = {
  percent: number
  limitTokens: number
  usedTokens: number
  messageTokens: number
  systemReserveTokens: number
  outputReserveTokens: number
  /** True when Settings → API uses “no limit” for `max_tokens`. */
  replyBudgetUnlimited: boolean
  messageCount: number
}

export function getChatContextUsageDetails(
  messages: readonly Pick<Message, 'role' | 'content'>[],
  modelId: string,
  reservedOutputTokens: number = LLM_MAX_TOKENS_DEFAULT
): ChatContextUsageDetails {
  const forApi = messages.filter((m) => m.role !== 'thinking')
  const limitTokens = getModelContextLimit(modelId)
  const messageTokens = forApi.reduce(
    (sum, message) => sum + MESSAGE_OVERHEAD_TOKENS + estimateTextTokens(message.content),
    0
  )
  const systemReserveTokens = SYSTEM_PROMPT_RESERVE
  const replyBudgetUnlimited = isLlmMaxTokensUnlimited(reservedOutputTokens)
  const outputReserveTokens = resolveOutputTokenReserve(modelId, reservedOutputTokens)
  const usedTokens = systemReserveTokens + messageTokens + outputReserveTokens
  const percent =
    limitTokens <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((usedTokens / limitTokens) * 100)))

  return {
    percent,
    limitTokens,
    usedTokens,
    messageTokens,
    systemReserveTokens,
    outputReserveTokens,
    replyBudgetUnlimited,
    messageCount: forApi.length
  }
}

export function trimMessagesForContext(
  messages: readonly Message[],
  modelId: string,
  targetPercent = 50,
  reservedOutputTokens = LLM_MAX_TOKENS_DEFAULT
): Message[] {
  if (messages.length <= 2) return [...messages]

  const limit = getModelContextLimit(modelId)
  const targetTokens = Math.floor((limit * targetPercent) / 100)
  const reservedOutput = resolveOutputTokenReserve(modelId, reservedOutputTokens)

  let trimmed = [...messages]
  while (
    trimmed.length > 2 &&
    estimateChatContextTokens(trimmed) + reservedOutput > targetTokens
  ) {
    trimmed = trimmed.slice(1)
    while (
      trimmed.length > 0 &&
      (trimmed[0]?.role === 'assistant' || trimmed[0]?.role === 'thinking')
    ) {
      trimmed = trimmed.slice(1)
    }
  }

  return trimmed
}

export type TrimMessagesToTokenBudgetResult = {
  messages: Message[]
  /** True when older turns were dropped for the model context window. */
  historyTruncated: boolean
}

function dropLeadingNonUser(messages: Message[]): Message[] {
  let trimmed = messages
  while (
    trimmed.length > 0 &&
    (trimmed[0]?.role === 'assistant' || trimmed[0]?.role === 'thinking')
  ) {
    trimmed = trimmed.slice(1)
  }
  return trimmed
}

/** Keeps the newest messages that fit the model input budget (output tokens reserved separately). */
export function trimMessagesToTokenBudgetWithMeta(
  messages: readonly Message[],
  modelId: string,
  reservedOutputTokens: number = LLM_MAX_TOKENS_DEFAULT
): TrimMessagesToTokenBudgetResult {
  if (messages.length <= 2) {
    return { messages: [...messages], historyTruncated: false }
  }

  const limit = getModelContextLimit(modelId)
  const reservedOutput = resolveOutputTokenReserve(modelId, reservedOutputTokens)
  const inputBudget = Math.floor(
    (limit - reservedOutput - SYSTEM_PROMPT_RESERVE) * (1 - CONTEXT_SAFETY_MARGIN)
  )
  let trimmed = [...messages]
  const originalLength = trimmed.length

  while (trimmed.length > 2 && estimateChatContextTokens(trimmed) > inputBudget) {
    trimmed = dropLeadingNonUser(trimmed.slice(1))
  }

  return {
    messages: trimmed,
    historyTruncated: trimmed.length < originalLength
  }
}

/** Keeps the newest messages that fit the model context (for API requests). */
export function trimMessagesToTokenBudget(
  messages: readonly Message[],
  modelId: string,
  reservedOutputTokens: number = LLM_MAX_TOKENS_DEFAULT
): Message[] {
  return trimMessagesToTokenBudgetWithMeta(messages, modelId, reservedOutputTokens).messages
}
