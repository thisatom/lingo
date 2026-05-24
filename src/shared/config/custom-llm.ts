/** User-defined OpenAI-compatible API (Ollama, LM Studio, vLLM, OpenAI, etc.). */
export const customLlmConfig = {
  defaultBaseUrl: 'http://127.0.0.1:11434/v1',
  defaultModel: 'llama3.2',
  maxTokens: 2048,
  maxTokensRetry: 3072
} as const

export function normalizeCustomModelId(modelId: string): string {
  return modelId.trim()
}

export function normalizeCustomApiBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '')
}

/**
 * OpenAI-compatible API root: no trailing slash, no `/chat/completions`, usually ends with `/v1`.
 * Accepts pasted snippet URLs that already include `/chat/completions`.
 */
export function normalizeCustomApiRootUrl(baseUrl: string): string {
  let trimmed = normalizeCustomApiBaseUrl(baseUrl)
  if (!trimmed) return ''
  trimmed = trimmed.replace(/\/chat\/completions$/i, '')
  if (!/\/v\d+$/i.test(trimmed)) {
    trimmed = `${trimmed}/v1`
  }
  return trimmed
}

/** Builds POST URL from API root or a pasted full completions URL. */
export function resolveChatCompletionsUrl(baseUrl: string): string {
  const root = normalizeCustomApiRootUrl(baseUrl)
  if (!root) return ''
  return `${root}/chat/completions`
}

export function isValidCustomApiBaseUrl(baseUrl: string): boolean {
  const url = resolveChatCompletionsUrl(baseUrl)
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidCustomModelId(modelId: string): boolean {
  const id = normalizeCustomModelId(modelId)
  if (!id || id.length > 256) return false
  return !/[\s<>"'`]/.test(id)
}
