import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WebContents } from 'electron'
import { sanitizeChatStreamRequest } from './sanitize-chat-stream-request'

vi.mock('./persisted-llm-settings', () => ({
  readPersistedLlmSnapshot: vi.fn()
}))

import { readPersistedLlmSnapshot } from './persisted-llm-settings'

const webContents = {} as WebContents

describe('sanitizeChatStreamRequest', () => {
  beforeEach(() => {
    vi.mocked(readPersistedLlmSnapshot).mockReset()
  })

  it('preserves assistantContinuationPrefix when no persisted snapshot', async () => {
    vi.mocked(readPersistedLlmSnapshot).mockResolvedValue(null)

    const safe = await sanitizeChatStreamRequest(
      {
        messages: [{ role: 'user', content: 'Hello' }],
        assistantContinuationPrefix: 'Partial answer that was cut off'
      },
      webContents
    )

    expect(safe.assistantContinuationPrefix).toBe('Partial answer that was cut off')
  })

  it('preserves assistantContinuationPrefix with persisted LLM settings', async () => {
    vi.mocked(readPersistedLlmSnapshot).mockResolvedValue({
      llmBackend: 'openrouter',
      modelId: 'openrouter/free',
      customApiBaseUrl: '',
      customModelId: '',
      customLlmProfileJson: '',
      webSearchEnabled: false,
      languagePracticeEnabled: true,
      modelAutoFallback: false,
      llmMaxTokens: 2048
    })

    const safe = await sanitizeChatStreamRequest(
      {
        messages: [{ role: 'user', content: 'Hello' }],
        assistantContinuationPrefix: 'Partial answer that was cut off'
      },
      webContents
    )

    expect(safe.assistantContinuationPrefix).toBe('Partial answer that was cut off')
    expect(safe.model).toBe('openrouter/free')
  })
})
