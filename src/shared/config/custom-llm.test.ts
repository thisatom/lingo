import { describe, expect, it } from 'vitest'
import { resolveChatCompletionsUrl } from '@/shared/config/custom-llm'

describe('resolveChatCompletionsUrl', () => {
  it('appends chat/completions to OpenAI-style base', () => {
    expect(resolveChatCompletionsUrl('http://127.0.0.1:11434/v1')).toBe(
      'http://127.0.0.1:11434/v1/chat/completions'
    )
  })

  it('keeps a full completions URL', () => {
    expect(resolveChatCompletionsUrl('https://api.example.com/v1/chat/completions')).toBe(
      'https://api.example.com/v1/chat/completions'
    )
  })
})
