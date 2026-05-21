import { normalizeOpenRouterModelId, openRouterSuggestedModels } from '@/shared/config/openrouter'
import {
  filterOpenRouterFreeModels,
  isOpenRouterFreeModel
} from '@/shared/config/openrouter-free-models'

/** Merge suggested, saved, and active free model ids (deduped, stable order). */
export function mergeOpenRouterModelIds(
  customModels: readonly string[],
  activeModelId?: string
): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  const add = (raw: string) => {
    const id = normalizeOpenRouterModelId(raw)
    if (!id || !isOpenRouterFreeModel(id)) return
    const key = id.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    result.push(id)
  }

  for (const id of customModels) add(id)
  if (activeModelId) add(activeModelId)
  for (const id of openRouterSuggestedModels) add(id)

  return filterOpenRouterFreeModels(result)
}

export function isModelInOpenRouterLists(
  modelId: string,
  customModels: readonly string[]
): boolean {
  const key = normalizeOpenRouterModelId(modelId).toLowerCase()
  if (!key) return true
  if (customModels.some((m) => normalizeOpenRouterModelId(m).toLowerCase() === key)) {
    return true
  }
  return openRouterSuggestedModels.some(
    (m) => normalizeOpenRouterModelId(m).toLowerCase() === key
  )
}
