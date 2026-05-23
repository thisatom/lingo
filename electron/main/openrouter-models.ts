import { fetchOpenRouterModelCatalog } from '@/shared/lib/fetch-openrouter-models'
import { getSecret } from './secrets'

export async function listOpenRouterModelsInMain(): Promise<string[]> {
  const apiKey = await getSecret('openrouter')
  if (!apiKey) throw new Error('NO_OPENROUTER_KEY')
  return fetchOpenRouterModelCatalog(apiKey)
}
