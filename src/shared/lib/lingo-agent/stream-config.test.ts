import { describe, expect, it, vi, afterEach } from 'vitest'
import { isAiSdkStreamEnabled, shouldUseAiSdkStreamForRequest } from '@/shared/lib/lingo-agent/stream-config'

describe('stream-config', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses legacy SSE in vitest by default', () => {
    expect(isAiSdkStreamEnabled()).toBe(false)
  })

  it('honors LINGO_AI_SDK_STREAM=1 in tests', () => {
    vi.stubEnv('LINGO_AI_SDK_STREAM', '1')
    expect(isAiSdkStreamEnabled()).toBe(true)
  })

  it('skips AI SDK for custom LLM backend', () => {
    vi.stubEnv('LINGO_AI_SDK_STREAM', '1')
    expect(shouldUseAiSdkStreamForRequest({ llmBackend: 'custom' })).toBe(false)
    expect(shouldUseAiSdkStreamForRequest({ llmBackend: 'openrouter' })).toBe(true)
  })
})
