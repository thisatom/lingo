import {
  isOpenRouterAutoModel,
  normalizeOpenRouterModelId,
  openRouterConfig
} from '@/shared/config/openrouter'

export function getWebSearchProvider(
  modelId: string,
  options?: { local?: boolean }
): { href: string; label: string } {
  if (options?.local) {
    return { href: 'https://github.com/mnhlt/WebSearch-MCP', label: 'WebSearch MCP' }
  }
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
