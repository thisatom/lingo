import { describe, expect, it } from 'vitest'
import { chatTitleMarginLeftPx } from '@/shared/lib/chat-header-inset'

describe('chatTitleMarginLeftPx', () => {
  it('returns 0 when main column clears fixed chrome', () => {
    expect(chatTitleMarginLeftPx(280, 8)).toBe(0)
  })

  it('keeps title flush after chrome when sidebar is hidden', () => {
    expect(chatTitleMarginLeftPx(0, 8)).toBe(93)
    expect(chatTitleMarginLeftPx(0, 12)).toBe(89)
    expect(chatTitleMarginLeftPx(0, 16)).toBe(85)
  })

  it('ramps margin in during the last part of collapse', () => {
    expect(chatTitleMarginLeftPx(50, 8)).toBe(43)
    expect(chatTitleMarginLeftPx(92, 8)).toBe(1)
  })
})
