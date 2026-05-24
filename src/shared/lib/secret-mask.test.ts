import { describe, expect, it } from 'vitest'
import {
  isMaskedSecretDisplay,
  maskSecretForDisplay,
  normalizeBearerApiKey
} from './secret-mask'

describe('secret-mask', () => {
  it('masks keys for display only', () => {
    expect(maskSecretForDisplay('nvapi-1234567890abcdef')).toBe('nvapi-…cdef')
  })

  it('detects masked display strings', () => {
    expect(isMaskedSecretDisplay('nvapi-…cdef')).toBe(true)
    expect(isMaskedSecretDisplay('••••••••')).toBe(true)
    expect(isMaskedSecretDisplay('nvapi-full-secret-key-here')).toBe(false)
  })

  it('strips Bearer prefix for API use', () => {
    expect(normalizeBearerApiKey('Bearer nvapi-abc')).toBe('nvapi-abc')
    expect(normalizeBearerApiKey('  bearer abc  ')).toBe('abc')
  })
})
