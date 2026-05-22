import { describe, expect, it } from 'vitest'
import {
  importCustomLlmProfileFromSnippet,
  parseCustomLlmProfileSource
} from '@/shared/lib/custom-llm-profile'

describe('parseCustomLlmProfileSource', () => {
  it('parses profile with completion extras', () => {
    const result = parseCustomLlmProfileSource(`{
      "baseURL": "https://api.deepseek.com/v1",
      "model": "deepseek-v4-pro",
      "completion": {
        "thinking": { "type": "enabled" },
        "reasoning_effort": "high",
        "stream": false
      }
    }`)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.baseUrl).toBe('https://api.deepseek.com/v1')
    expect(result.data.model).toBe('deepseek-v4-pro')
    expect(result.data.completionExtras.reasoning_effort).toBe('high')
  })

  it('rejects reserved completion keys', () => {
    const result = parseCustomLlmProfileSource(`{
      "baseURL": "http://127.0.0.1:11434/v1",
      "model": "llama3.2",
      "completion": { "messages": [] }
    }`)
    expect(result.ok).toBe(false)
  })
})

describe('importCustomLlmProfileFromSnippet', () => {
  it('imports OpenAI SDK-style snippet', () => {
    const snippet = `
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});
const completion = await openai.chat.completions.create({
  model: "deepseek-v4-pro",
  thinking: {"type": "enabled"},
  reasoning_effort: "high",
  stream: false,
});
`
    const json = importCustomLlmProfileFromSnippet(snippet)
    expect(json).not.toBeNull()
    const parsed = parseCustomLlmProfileSource(json!)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.model).toBe('deepseek-v4-pro')
    expect(parsed.data.completionExtras.reasoning_effort).toBe('high')
  })
})
