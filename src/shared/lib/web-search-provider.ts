import {
  isOpenRouterAutoModel,
  normalizeOpenRouterModelId,
  openRouterConfig
} from '@/shared/config/openrouter'

export function getWebSearchProvider(modelId: string): { href: string; label: string } {
  const id = normalizeOpenRouterModelId(modelId)
  if (
    isOpenRouterAutoModel(id) ||
    id === openRouterConfig.webSearchModel ||
    id.includes('perplexity')
  ) {
    return {
      href: 'https://openrouter.ai/perplexity/sonar',
      label: 'Perplexity'
    }
  }
  return {
    href: 'https://openrouter.ai',
    label: 'OpenRouter'
  }
}
