import { buildModelFallbackChain } from '@/shared/config/openrouter-free-models'
import { isOpenRouterCreditError } from '@/shared/lib/openrouter-errors'
import { isVisionApiError } from '@/shared/lib/image-ocr-messages'

/** Errors where trying another free model may succeed. */
export function isRetryableModelError(message: string): boolean {
  const m = message.toLowerCase()
  if (m.includes('no_openrouter_key')) return false
  if (m.includes('aborted')) return false
  if (m.includes('ocr is not available')) return false

  if (isOpenRouterCreditError(message)) return true
  if (isVisionApiError(message)) return true

  return (
    m.includes('rate limit') ||
    m.includes('rate-limited') ||
    m.includes('too many requests') ||
    m.includes('429') ||
    m.includes('503') ||
    m.includes('502') ||
    m.includes('504') ||
    m.includes('overloaded') ||
    m.includes('unavailable') ||
    m.includes('temporarily') ||
    m.includes('capacity') ||
    m.includes('no endpoints') ||
    m.includes('not found') ||
    m.includes('does not exist') ||
    m.includes('provider returned') ||
    m.includes('upstream') ||
    m.includes('timeout') ||
    m.includes('empty response') ||
    m.includes('incomplete answer')
  )
}

export async function runWithModelFallback(
  primaryModelId: string,
  modelAutoFallback: boolean,
  run: (modelId: string) => Promise<void>
): Promise<void> {
  const chain = modelAutoFallback
    ? buildModelFallbackChain(primaryModelId)
    : [primaryModelId.trim()].filter(Boolean)

  if (chain.length === 0) {
    throw new Error('No model selected')
  }

  let lastError: Error | null = null

  for (const modelId of chain) {
    try {
      await run(modelId)
      return
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      lastError = err
      const isLast = modelId === chain[chain.length - 1]
      if (!modelAutoFallback || isLast || !isRetryableModelError(err.message)) {
        throw err
      }
    }
  }

  throw lastError ?? new Error('All models failed')
}
