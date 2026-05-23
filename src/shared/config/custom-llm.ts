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

/** Accepts `https://host/v1` or a full `…/chat/completions` URL. */
export function resolveChatCompletionsUrl(baseUrl: string): string {
  const trimmed = normalizeCustomApiBaseUrl(baseUrl)
  if (!trimmed) return ''
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed
  return `${trimmed}/chat/completions`
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
