export const openRouterConfig = {
  baseURL: 'https://openrouter.ai/api/v1',
  defaultModel: 'openai/gpt-4o-mini',
  /** Reliable web-search model (also used when user picks `openrouter/auto`). */
  webSearchModel: 'perplexity/sonar',
  /** Legacy; STT uses free local Whisper in the desktop app. */
  sttModel: 'openai/whisper-large-v3',
  /** Default completion budget (fits low-credit OpenRouter accounts). */
  maxTokens: 1024,
  /** Retry after a short/incomplete web-search answer. */
  maxTokensRetry: 1536,
  /** Last resort when OpenRouter rejects the requested max_tokens budget. */
  maxTokensCreditFallback: 512
} as const

export function isOpenRouterAutoModel(modelId: string): boolean {
  return normalizeOpenRouterModelId(modelId).toLowerCase() === 'openrouter/auto'
}

export function normalizeOpenRouterModelId(modelId: string): string {
  return modelId.trim().replace(/:online$/i, '')
}

/** Common OpenRouter model ids for the settings combobox (any id can still be applied). */
export const openRouterSuggestedModels: readonly string[] = [
  'openrouter/auto',
  openRouterConfig.webSearchModel,
  openRouterConfig.defaultModel,
  'openai/gpt-4o',
  'openai/gpt-4.1-mini',
  'openai/gpt-4.1',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.7-sonnet',
  'anthropic/claude-sonnet-4',
  'google/gemini-2.0-flash-001',
  'google/gemini-2.5-flash-preview',
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-small-3.1-24b-instruct',
  'deepseek/deepseek-chat',
  'qwen/qwen-2.5-72b-instruct'
]
