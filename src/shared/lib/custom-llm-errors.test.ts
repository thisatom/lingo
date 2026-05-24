import { describe, expect, it } from 'vitest'
import {
  customEndpointRequiresApiKey,
  formatCustomLlmHttpError,
  validateCustomProviderModelId
} from '@/shared/lib/custom-llm-errors'

describe('formatCustomLlmHttpError', () => {
  it('explains NVIDIA-style 401 JSON', () => {
    const message = formatCustomLlmHttpError('Authentication failed', 401)
    expect(message).toContain('Custom endpoint API key')
    expect(message).toContain('nvapi')
  })

  it('explains 404 for custom endpoints', () => {
    const message = formatCustomLlmHttpError('404 page not found', 404)
    expect(message).toContain('integrate.api.nvidia.com')
    expect(message).toContain('meta/llama-3.1-8b-instruct')
  })
})

describe('customEndpointRequiresApiKey', () => {
  it('is false for local Ollama', () => {
    expect(customEndpointRequiresApiKey('http://127.0.0.1:11434/v1')).toBe(false)
  })

  it('is false for localhost', () => {
    expect(customEndpointRequiresApiKey('http://localhost:11434/v1')).toBe(false)
  })

  it('is true for NVIDIA', () => {
    expect(customEndpointRequiresApiKey('https://integrate.api.nvidia.com/v1')).toBe(true)
  })

  it('is true for LAN host (not loopback)', () => {
    expect(customEndpointRequiresApiKey('http://192.168.1.10:11434/v1')).toBe(true)
  })
})

describe('validateCustomProviderModelId', () => {
  it('rejects bare llama3.2 on NVIDIA hosts', () => {
    expect(
      validateCustomProviderModelId('https://integrate.api.nvidia.com/v1', 'llama3.2')
    ).toContain('meta/llama-3.1-8b-instruct')
  })

  it('allows catalog ids with a slash', () => {
    expect(
      validateCustomProviderModelId(
        'https://integrate.api.nvidia.com/v1',
        'meta/llama-3.1-8b-instruct'
      )
    ).toBeNull()
  })
})
