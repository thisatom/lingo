import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assertOutboundHttpUrl,
  fetchWithOutboundPolicy,
  OutboundUrlBlockedError
} from './outbound-url-policy'

describe('assertOutboundHttpUrl', () => {
  it('allows public https URLs', () => {
    const url = assertOutboundHttpUrl('https://openrouter.ai/api/v1/models')
    expect(url.hostname).toBe('openrouter.ai')
  })

  it('blocks localhost for link preview policy', () => {
    expect(() => assertOutboundHttpUrl('http://127.0.0.1:11434/v1')).toThrow(OutboundUrlBlockedError)
  })

  it('allows localhost when private network is opted in', () => {
    const url = assertOutboundHttpUrl('http://127.0.0.1:11434/v1', { allowPrivateNetwork: true })
    expect(url.hostname).toBe('127.0.0.1')
  })

  it('blocks cloud metadata address', () => {
    expect(() => assertOutboundHttpUrl('http://169.254.169.254/latest/meta-data/')).toThrow(
      OutboundUrlBlockedError
    )
  })

  it('blocks credentials in URL', () => {
    expect(() => assertOutboundHttpUrl('http://user:pass@example.com/')).toThrow(
      OutboundUrlBlockedError
    )
  })
})

describe('fetchWithOutboundPolicy', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects redirect to private network', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 302,
          headers: { Location: 'http://127.0.0.1/private' }
        })
      )
    )

    await expect(fetchWithOutboundPolicy('https://example.com/start')).rejects.toThrow(
      OutboundUrlBlockedError
    )
  })
})
