import { describe, expect, it } from 'vitest'
import {
  normalizeCustomApiRootUrl,
  resolveChatCompletionsUrl
} from '@/shared/config/custom-llm'

describe('normalizeCustomApiRootUrl', () => {
  it('strips /chat/completions and keeps /v1', () => {
    expect(normalizeCustomApiRootUrl('https://integrate.api.nvidia.com/v1/chat/completions')).toBe(
      'https://integrate.api.nvidia.com/v1'
    )
  })

  it('appends /v1 when missing', () => {
    expect(normalizeCustomApiRootUrl('https://integrate.api.nvidia.com')).toBe(
      'https://integrate.api.nvidia.com/v1'
    )
  })
})

describe('resolveChatCompletionsUrl', () => {
  it('appends chat/completions to OpenAI-style base', () => {
    expect(resolveChatCompletionsUrl('http://127.0.0.1:11434/v1')).toBe(
      'http://127.0.0.1:11434/v1/chat/completions'
    )
  })

  it('normalizes a pasted full completions URL once', () => {
    expect(resolveChatCompletionsUrl('https://integrate.api.nvidia.com/v1/chat/completions')).toBe(
      'https://integrate.api.nvidia.com/v1/chat/completions'
    )
  })

  it('never doubles /chat/completions', () => {
    const url = resolveChatCompletionsUrl('https://integrate.api.nvidia.com/v1/chat/completions')
    expect(url).not.toMatch(/chat\/completions\/chat\/completions/i)
  })
})
