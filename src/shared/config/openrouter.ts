import { openRouterFreeModels } from '@/shared/config/openrouter-free-models'

export const openRouterConfig = {
  baseURL: 'https://openrouter.ai/api/v1',
  defaultModel: 'nvidia/nemotron-3-super-120b-a12b:free',
  /** Free router for web-search-style requests when user picks `openrouter/free`. */
  webSearchModel: 'openrouter/free',
  /** Legacy; STT uses free local Whisper in the desktop app. */
  sttModel: 'openai/whisper-large-v3',
  /** Default completion budget per assistant turn. */
  maxTokens: 2048,
  /** Retry after a short/incomplete answer (higher cap). */
  maxTokensRetry: 3072,
  /** Last resort when OpenRouter rejects the requested max_tokens budget. */
  maxTokensCreditFallback: 512
} as const

export function isOpenRouterAutoModel(modelId: string): boolean {
  return normalizeOpenRouterModelId(modelId).toLowerCase() === 'openrouter/auto'
}

export function normalizeOpenRouterModelId(modelId: string): string {
  return modelId.trim().replace(/:online$/i, '')
}

/** Free OpenRouter models for settings and agent model picker. */
export const openRouterSuggestedModels: readonly string[] = [
  openRouterConfig.defaultModel,
  ...openRouterFreeModels.filter((id) => id !== openRouterConfig.defaultModel)
]
