import { describe, expect, it } from 'vitest'
import { buildChatStreamLlmFields } from './resolve-chat-stream-llm'

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
})
