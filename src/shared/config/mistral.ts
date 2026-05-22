/** Mistral AI direct API (OpenAI-compatible). */
export const mistralConfig = {
  baseURL: 'https://api.mistral.ai/v1',
  defaultModel: 'mistral-small-latest',
  maxTokens: 1024,
  maxTokensRetry: 1536
} as const

export function normalizeMistralModelId(modelId: string): string {
  return modelId.trim()
}

/** Curated chat models; users can add custom ids via combobox. */
export const mistralSuggestedModels: readonly string[] = [
  mistralConfig.defaultModel,
  'mistral-medium-latest',
  'mistral-large-latest',
  'open-mistral-nemo',
  'codestral-latest',
  'pixtral-large-latest',
  'pixtral-12b-2409',
  'ministral-8b-latest'
]

const MISTRAL_MODEL_KEYS = new Set(
  mistralSuggestedModels.map((m) => normalizeMistralModelId(m).toLowerCase())
)

export function isMistralModel(modelId: string): boolean {
  const id = normalizeMistralModelId(modelId).toLowerCase()
  if (!id) return false
  if (MISTRAL_MODEL_KEYS.has(id)) return true
  return /^[a-z0-9][a-z0-9._-]*$/i.test(id)
}
