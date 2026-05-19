import {
  isOpenRouterAutoModel,
  normalizeOpenRouterModelId,
  openRouterConfig
} from '../../src/shared/config/openrouter'

export function withOnlineVariant(modelId: string): string {
  const base = normalizeOpenRouterModelId(modelId)
  return base.endsWith(':online') ? base : `${base}:online`
}

/** Model that supports OpenRouter web search reliably. */
export function resolveWebSearchModel(userModelId: string): string {
  if (isOpenRouterAutoModel(userModelId)) {
    return openRouterConfig.webSearchModel
  }
  const base = normalizeOpenRouterModelId(userModelId)
  if (base.startsWith('perplexity/')) return base
  return withOnlineVariant(base)
}

export function extractAssistantText(message: {
  content?: string | Array<{ type?: string; text?: string }> | null
}): string {
  if (!message.content) return ''
  if (typeof message.content === 'string') return message.content
  if (Array.isArray(message.content)) {
    return message.content
      .filter((part) => part.type === 'text' && part.text)
      .map((part) => part.text)
      .join('')
  }
  return ''
}
