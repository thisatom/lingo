import { describe, expect, it } from 'vitest'
import { LLM_MAX_TOKENS_UNLIMITED } from '@/shared/lib/llm-max-tokens'
import { buildChatStreamLlmFields, resolveChatStreamWebSearch } from './resolve-chat-stream-llm'

describe('resolveChatStreamWebSearch', () => {
  const base = {
    webSearchEnabled: true,
    llmBackend: 'openrouter' as const
  }

  it('requires settings on and per-turn approval (any backend)', () => {
    expect(resolveChatStreamWebSearch(base, true)).toBe(true)
    expect(resolveChatStreamWebSearch(base, false)).toBe(false)
    expect(resolveChatStreamWebSearch({ ...base, llmBackend: 'custom' }, true)).toBe(true)
  })

  it('trusts per-turn true from renderer even when persisted web search is off', () => {
    expect(resolveChatStreamWebSearch({ ...base, webSearchEnabled: false }, true)).toBe(true)
  })

  it('falls back to persisted setting when per-turn is omitted', () => {
    expect(resolveChatStreamWebSearch({ ...base, webSearchEnabled: true }, undefined)).toBe(true)
    expect(resolveChatStreamWebSearch({ ...base, webSearchEnabled: false }, undefined)).toBe(false)
  })
})

describe('buildChatStreamLlmFields', () => {
  it('builds distinct custom endpoints from settings snapshots (main-trusted routing)', () => {
    const userOllama = buildChatStreamLlmFields({
      llmBackend: 'custom',
      modelId: 'ignored',
      customApiBaseUrl: 'http://127.0.0.1:11434/v1',
      customModelId: 'llama3.2',
      customLlmProfileJson: '',
      webSearchEnabled: false,
      modelAutoFallback: false,
      llmMaxTokens: 2048
    })

    const attackerPayload = buildChatStreamLlmFields({
      llmBackend: 'custom',
      modelId: 'evil',
      customApiBaseUrl: 'http://169.254.169.254/v1',
      customModelId: 'steal',
      customLlmProfileJson: '',
      webSearchEnabled: false,
      modelAutoFallback: false,
      llmMaxTokens: 2048
    })

    expect(userOllama.customLlm?.baseUrl).toContain('127.0.0.1')
    expect(attackerPayload.customLlm?.baseUrl).toContain('169.254.169.254')
    expect(userOllama.customLlm?.baseUrl).not.toBe(attackerPayload.customLlm?.baseUrl)
  })

  it('passes zero maxTokens when settings use unlimited reply budget', () => {
    const fields = buildChatStreamLlmFields({
      llmBackend: 'openrouter',
      modelId: 'openai/gpt-4o-mini',
      customApiBaseUrl: '',
      customModelId: '',
      customLlmProfileJson: '',
      webSearchEnabled: false,
      modelAutoFallback: false,
      llmMaxTokens: LLM_MAX_TOKENS_UNLIMITED
    })
    expect(fields.maxTokens).toBe(0)
    expect(fields.maxTokensRetry).toBe(0)
  })
})
