import { normalizeOpenRouterModelId } from '@/shared/config/openrouter'

/** OpenRouter models with $0 pricing (`:free` suffix or free router). */
export const openRouterFreeModels: readonly string[] = [
  'openrouter/free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'google/gemma-3-27b-it:free',
  'google/gemma-3-12b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'qwen/qwen3-235b-a22b:free',
  'qwen/qwen3-4b:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'deepseek/deepseek-r1-distill-llama-70b:free',
  'microsoft/phi-3-medium-128k-instruct:free'
]

export function isOpenRouterFreeModel(modelId: string): boolean {
  const id = normalizeOpenRouterModelId(modelId).toLowerCase()
  if (!id) return false
  if (id === 'openrouter/free') return true
  return id.endsWith(':free')
}

/** @deprecated Use `openrouter/free` — kept for saved settings migration. */
export function isOpenRouterFreeRouter(modelId: string): boolean {
  const id = normalizeOpenRouterModelId(modelId).toLowerCase()
  return id === 'openrouter/free' || id === 'openrouter/auto'
}

export function filterOpenRouterFreeModels(modelIds: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of modelIds) {
    const id = normalizeOpenRouterModelId(raw)
    if (!isOpenRouterFreeModel(id)) continue
    const key = id.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(id)
  }
  return out
}

/** Primary model first, then other free models — each id at most once (no cycles). */
export function buildModelFallbackChain(primaryModelId: string): string[] {
  const primary = normalizeOpenRouterModelId(primaryModelId)
  const seen = new Set<string>()
  const chain: string[] = []

  const add = (raw: string) => {
    const id = normalizeOpenRouterModelId(raw)
    if (!isOpenRouterFreeModel(id)) return
    const key = id.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    chain.push(id)
  }

  if (primary) add(primary)
  for (const id of openRouterFreeModels) add(id)
  return chain
}
