export type LlmProviderId = 'openrouter' | 'mistral'

export function isLlmProviderId(value: unknown): value is LlmProviderId {
  return value === 'openrouter' || value === 'mistral'
}

export function secretProviderForLlm(provider: LlmProviderId): 'openrouter' | 'mistral' {
  return provider
}

export function missingKeyErrorCode(provider: LlmProviderId): string {
  return provider === 'mistral' ? 'NO_MISTRAL_KEY' : 'NO_OPENROUTER_KEY'
}
