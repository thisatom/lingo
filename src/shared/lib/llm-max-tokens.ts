import { openRouterConfig } from '@/shared/config/openrouter'

export const LLM_MAX_TOKENS_MIN = 256
export const LLM_MAX_TOKENS_MAX = 32_768
export const LLM_MAX_TOKENS_DEFAULT: number = openRouterConfig.maxTokens

export const LLM_MAX_TOKENS_PRESETS: readonly { value: number; label: string }[] = [
  { value: 512, label: '512 — very short' },
  { value: 1024, label: '1024 — default' },
  { value: 2048, label: '2048' },
  { value: 4096, label: '4096' },
  { value: 8192, label: '8192' },
  { value: 16_384, label: '16 384 — long replies' }
] as const

export function clampLlmMaxTokens(value: number): number {
  if (!Number.isFinite(value)) return LLM_MAX_TOKENS_DEFAULT
  return Math.min(LLM_MAX_TOKENS_MAX, Math.max(LLM_MAX_TOKENS_MIN, Math.round(value)))
}

export function isLlmMaxTokensPreset(value: number): boolean {
  return LLM_MAX_TOKENS_PRESETS.some((p) => p.value === value)
}

export function normalizeLlmMaxTokens(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return LLM_MAX_TOKENS_DEFAULT
  }
  return clampLlmMaxTokens(value)
}

/** Retry budget after a short / incomplete answer (capped). */
export function llmMaxTokensRetryBudget(maxTokens: number): number {
  const base = clampLlmMaxTokens(maxTokens)
  return clampLlmMaxTokens(Math.round(base * 1.5))
}
