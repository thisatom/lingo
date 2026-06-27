import { describe, expect, it } from 'vitest'
import {
  isRetryableStreamError,
  reconnectDelayMs,
  STREAM_RECONNECT_MAX_ATTEMPTS
} from '@/features/ai-chat/lib/stream-reconnect'

describe('stream-reconnect', () => {
  it('caps reconnect attempts', () => {
    expect(STREAM_RECONNECT_MAX_ATTEMPTS).toBe(3)
    expect(reconnectDelayMs(99)).toBeGreaterThan(0)
  })

  it('does not retry aborted streams', () => {
    expect(isRetryableStreamError(new DOMException('aborted', 'AbortError'))).toBe(false)
  })

  it('retries transient upstream failures', () => {
    expect(isRetryableStreamError(new Error('503 Service Unavailable'))).toBe(true)
  })
})
