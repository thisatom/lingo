import {
  isOpenRouterAutoModel,
  normalizeOpenRouterModelId,
  openRouterConfig
} from '@/shared/config/openrouter'
import { isOpenRouterFreeRouter } from '@/shared/config/openrouter-free-models'
import { stripAssistantRoleMarkup } from '@/shared/lib/strip-assistant-role-markup'

export function withOnlineVariant(modelId: string): string {
  const base = normalizeOpenRouterModelId(modelId)
  return base.endsWith(':online') ? base : `${base}:online`
}

/** Model that supports OpenRouter web search reliably (free tier). */
export function resolveWebSearchModel(userModelId: string): string {
  if (isOpenRouterAutoModel(userModelId) || isOpenRouterFreeRouter(userModelId)) {
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
  let raw = ''
  if (typeof message.content === 'string') raw = message.content
  else if (Array.isArray(message.content)) {
    raw = message.content
      .filter((part) => part.type === 'text' && part.text)
      .map((part) => part.text)
      .join('')
  }
  return stripAssistantRoleMarkup(raw)
}
