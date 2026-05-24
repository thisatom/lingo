import { describe, expect, it } from 'vitest'
import {
  LLM_MAX_TOKENS_UNLIMITED,
  clampLlmMaxTokens,
  isLlmMaxTokensUnlimited,
  normalizeLlmMaxTokens
} from './llm-max-tokens'

describe('llm max tokens unlimited', () => {
  it('treats 0 as unlimited', () => {
    expect(isLlmMaxTokensUnlimited(0)).toBe(true)
    expect(normalizeLlmMaxTokens(0)).toBe(LLM_MAX_TOKENS_UNLIMITED)
    expect(clampLlmMaxTokens(0)).toBe(LLM_MAX_TOKENS_UNLIMITED)
  })

  it('still clamps finite presets', () => {
    expect(normalizeLlmMaxTokens(2048)).toBe(2048)
    expect(normalizeLlmMaxTokens(99_999)).toBe(32_768)
  })
})
