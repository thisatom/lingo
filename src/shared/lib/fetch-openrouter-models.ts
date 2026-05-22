import { openRouterConfig } from '@/shared/config/openrouter'
import { openRouterHeaders } from '@/shared/lib/openrouter-headers'
import { normalizeOpenRouterModelId } from '@/shared/config/openrouter'

type ModelsResponse = {
  data?: Array<{ id?: string }>
}

let catalogCache: { key: string; ids: string[]; at: number } | null = null
const CACHE_MS = 5 * 60 * 1000

/** Fetch model ids from OpenRouter (cached per API key prefix). */
export async function fetchOpenRouterModelCatalog(apiKey: string): Promise<string[]> {
  const key = apiKey.slice(0, 12)
  const now = Date.now()
  if (catalogCache && catalogCache.key === key && now - catalogCache.at < CACHE_MS) {
    return catalogCache.ids
  }

  const response = await fetch(`${openRouterConfig.baseURL}/models`, {
    headers: openRouterHeaders(apiKey)
  })

  if (!response.ok) {
    throw new Error(`OpenRouter models (${response.status})`)
  }

  const body = (await response.json()) as ModelsResponse
  const seen = new Set<string>()
  const ids: string[] = []

  for (const entry of body.data ?? []) {
    const id = normalizeOpenRouterModelId(entry.id ?? '')
    if (!id || !id.includes('/') || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }

  ids.sort((a, b) => a.localeCompare(b))
  catalogCache = { key, ids, at: now }
  return ids
}

export function isOpenRouterModelIdShape(id: string): boolean {
  const n = normalizeOpenRouterModelId(id)
  if (!n.includes('/')) return false
  return /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._:+-]*$/i.test(n)
}
