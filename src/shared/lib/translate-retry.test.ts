import { describe, expect, it, vi } from 'vitest'
import { isRetryableTranslateError, withTranslateRetry } from '@/shared/lib/translate-retry'

describe('translate-retry', () => {
  it('retries retryable errors', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce('ok')

    await expect(withTranslateRetry(fn, 2)).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does not retry validation errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('TRANSLATE_EMPTY'))

    await expect(withTranslateRetry(fn, 3)).rejects.toThrow('TRANSLATE_EMPTY')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('detects retryable network errors', () => {
    expect(isRetryableTranslateError(new Error('NetworkError when attempting to fetch resource'))).toBe(
      true
    )
    expect(isRetryableTranslateError(new Error('TRANSLATE_TARGET_REQUIRED'))).toBe(false)
  })
})
