import { normalizeOpenRouterModelId, openRouterConfig } from '@/shared/config/openrouter'
import { LLM_MAX_TOKENS_DEFAULT, normalizeLlmMaxTokens } from '@/shared/lib/llm-max-tokens'
import type { Message } from '@/entities/message/model/types'

const MESSAGE_OVERHEAD_TOKENS = 4
const SYSTEM_PROMPT_RESERVE = 256
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
  'google/gemma-3-27b-it:free': 128_000
}

export function getModelContextLimit(modelId: string): number {
  const key = normalizeOpenRouterModelId(modelId).toLowerCase()
  return MODEL_CONTEXT_LIMITS[key] ?? DEFAULT_CONTEXT_LIMIT
}

export function estimateTextTokens(text: string): number {
  if (!text.trim()) return 0
  return Math.ceil(text.length / 3.5)
}

export function estimateChatContextTokens(
  messages: readonly Pick<Message, 'role' | 'content'>[]
): number {
  return (
    SYSTEM_PROMPT_RESERVE +
    messages.reduce(
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
  messageCount: number
}

export function getChatContextUsageDetails(
  messages: readonly Pick<Message, 'role' | 'content'>[],
  modelId: string,
  reservedOutputTokens: number = LLM_MAX_TOKENS_DEFAULT
): ChatContextUsageDetails {
  const limitTokens = getModelContextLimit(modelId)
  const messageTokens = messages.reduce(
    (sum, message) => sum + MESSAGE_OVERHEAD_TOKENS + estimateTextTokens(message.content),
    0
  )
  const systemReserveTokens = SYSTEM_PROMPT_RESERVE
  const outputReserveTokens = reservedOutputTokens
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
    messageCount: messages.length
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
  const reservedOutput = normalizeLlmMaxTokens(reservedOutputTokens)

  let trimmed = [...messages]
  while (
    trimmed.length > 2 &&
    estimateChatContextTokens(trimmed) + reservedOutput > targetTokens
  ) {
    trimmed = trimmed.slice(1)
    while (trimmed.length > 0 && trimmed[0]?.role === 'assistant') {
      trimmed = trimmed.slice(1)
    }
  }

  return trimmed
}

/** Keeps the newest messages that fit the model context (for API requests). */
export function trimMessagesToTokenBudget(
  messages: readonly Message[],
  modelId: string,
  reservedOutputTokens: number = LLM_MAX_TOKENS_DEFAULT,
  maxUtilization = 0.85
): Message[] {
  if (messages.length <= 2) return [...messages]

  const limit = getModelContextLimit(modelId)
  const reservedOutput = normalizeLlmMaxTokens(reservedOutputTokens)
  const maxUsed = Math.floor(limit * maxUtilization)

  let trimmed = [...messages]
  while (
    trimmed.length > 2 &&
    estimateChatContextTokens(trimmed) + reservedOutput > maxUsed
  ) {
    trimmed = trimmed.slice(1)
    while (trimmed.length > 0 && trimmed[0]?.role === 'assistant') {
      trimmed = trimmed.slice(1)
    }
  }

  return trimmed
}
