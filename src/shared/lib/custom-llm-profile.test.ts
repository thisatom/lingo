import { describe, expect, it } from 'vitest'
import {
  importCustomLlmProfileFromSnippet,
  mergeCustomCompletionBody,
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

  it('parses axios snippet pasted directly', () => {
    const snippet = `const invokeUrl = "http://127.0.0.1:8080/v1/chat/completions";
const payload = { "model": "local-model", "stream": false };`
    const result = parseCustomLlmProfileSource(snippet)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.model).toBe('local-model')
    expect(result.data.completionExtras.stream).toBe(false)
  })

  it('rejects reserved completion keys', () => {
    const result = parseCustomLlmProfileSource(`{
      "baseURL": "http://127.0.0.1:11434/v1",
      "model": "llama3.2",
      "completion": { "messages": [] }
    }`)
    expect(result.ok).toBe(false)
  })

  it('strips apiKey from profile JSON and returns importedApiKey', () => {
    const result = parseCustomLlmProfileSource(`{
      "baseURL": "http://127.0.0.1:11434/v1",
      "model": "llama3.2",
      "apiKey": "secret-should-not-persist"
    }`)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.importedApiKey).toBe('secret-should-not-persist')
    expect(result.data.profile).not.toHaveProperty('apiKey')
    expect(JSON.stringify(result.data.profile)).not.toContain('secret-should-not-persist')
  })
})

describe('importCustomLlmProfileFromSnippet', () => {
  it('imports axios NVIDIA-style snippet', () => {
    const snippet = `
const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const headers = {
  "Authorization": "Bearer nvapi-test-key-12345",
  "Accept": "text/event-stream"
};
const payload = {
  "model": "google/gemma-3n-e2b-it",
  "messages": [{"role":"user","content":""}],
  "max_tokens": 512,
  "temperature": 0.20,
  "top_p": 0.70,
  "stream": true
};
axios.post(invokeUrl, payload, { headers });
`
    const imported = importCustomLlmProfileFromSnippet(snippet)
    expect(imported).not.toBeNull()
    expect(imported!.apiKey).toBe('nvapi-test-key-12345')
    const parsed = parseCustomLlmProfileSource(imported!.profileJson)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.baseUrl).toBe('https://integrate.api.nvidia.com/v1/chat/completions')
    expect(parsed.data.model).toBe('google/gemma-3n-e2b-it')
    expect(parsed.data.completionExtras.temperature).toBe(0.2)
    expect(parsed.data.completionExtras.top_p).toBe(0.7)
    expect(parsed.data.completionExtras.stream).toBe(true)
  })

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
    const imported = importCustomLlmProfileFromSnippet(snippet)
    expect(imported).not.toBeNull()
    const parsed = parseCustomLlmProfileSource(imported!.profileJson)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.model).toBe('deepseek-v4-pro')
    expect(parsed.data.completionExtras.reasoning_effort).toBe('high')
  })
})

describe('mergeCustomCompletionBody', () => {
  it('keeps Lingo max_tokens when profile extras include a lower cap', () => {
    const merged = mergeCustomCompletionBody(
      { model: 'm', messages: [], max_tokens: 4096, temperature: 0.7 },
      { max_tokens: 512, temperature: 0.2, stream: false }
    )
    expect(merged.max_tokens).toBe(4096)
    expect(merged.temperature).toBe(0.2)
    expect(merged.stream).toBe(false)
  })
})
