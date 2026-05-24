import { openRouterConfig } from '@/shared/config/openrouter'

export const LLM_MAX_TOKENS_MIN = 256
export const LLM_MAX_TOKENS_MAX = 32_768
/** Settings value: omit `max_tokens` on API requests (provider / model default). */
export const LLM_MAX_TOKENS_UNLIMITED = 0
export const LLM_MAX_TOKENS_DEFAULT: number = openRouterConfig.maxTokens

export const LLM_MAX_TOKENS_PRESETS: readonly { value: number; label: string }[] = [
  { value: LLM_MAX_TOKENS_UNLIMITED, label: 'No limit — model default' },
  { value: 512, label: '512 — very short' },
  { value: 1024, label: '1024' },
  { value: 2048, label: '2048 — default' },
  { value: 4096, label: '4096' },
  { value: 8192, label: '8192' },
  { value: 16_384, label: '16 384 — long replies' }
] as const

export function isLlmMaxTokensUnlimited(value: number): boolean {
  return value === LLM_MAX_TOKENS_UNLIMITED
}

export function clampLlmMaxTokens(value: number): number {
  if (isLlmMaxTokensUnlimited(value)) return LLM_MAX_TOKENS_UNLIMITED
  if (!Number.isFinite(value)) return LLM_MAX_TOKENS_DEFAULT
  return Math.min(LLM_MAX_TOKENS_MAX, Math.max(LLM_MAX_TOKENS_MIN, Math.round(value)))
}

export function isLlmMaxTokensPreset(value: number): boolean {
  return LLM_MAX_TOKENS_PRESETS.some((p) => p.value === value)
}

export function normalizeLlmMaxTokens(value: unknown): number {
  if (value === LLM_MAX_TOKENS_UNLIMITED || value === '0') {
    return LLM_MAX_TOKENS_UNLIMITED
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return LLM_MAX_TOKENS_DEFAULT
  }
  return clampLlmMaxTokens(value)
}

/** Retry budget after a short / incomplete answer (capped). */
export function llmMaxTokensRetryBudget(maxTokens: number): number {
  if (isLlmMaxTokensUnlimited(maxTokens)) return LLM_MAX_TOKENS_UNLIMITED
  const base = clampLlmMaxTokens(maxTokens)
  return clampLlmMaxTokens(Math.round(base * 1.5))
}

export function llmMaxTokensSelectValue(value: number): string {
  return String(normalizeLlmMaxTokens(value))
}
