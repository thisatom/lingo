import type { LlmProviderId } from '@/shared/types/llm-provider'
import { missingKeyErrorCode } from '@/shared/types/llm-provider'
import { formatOpenRouterError } from '@/shared/lib/openrouter-errors'

export function formatLlmError(message: string, provider: LlmProviderId = 'openrouter'): string {
  const missing = missingKeyErrorCode(provider)
  if (message.includes(missing)) {
    return provider === 'mistral'
      ? 'Add your Mistral API key in Settings.'
      : 'Add your OpenRouter API key in Settings.'
  }
  if (message.includes('NO_CUSTOM_LLM_KEY')) {
    return 'Add your API key under Settings → API → Custom endpoint API key (nvapi-… for NVIDIA).'
  }
  if (message.includes('NO_OPENROUTER_KEY')) {
    return 'Add your OpenRouter API key in Settings.'
  }
  if (message.includes('NO_MISTRAL_KEY')) {
    return 'Add your Mistral API key in Settings.'
  }
  return formatOpenRouterError(message)
}
