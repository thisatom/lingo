import { describe, expect, it } from 'vitest'
import { getChatHeaderDisplayTitle } from './chat-header-title'

describe('getChatHeaderDisplayTitle', () => {
  it('returns the chat title when set', () => {
    expect(getChatHeaderDisplayTitle('Practice Russian')).toBe('Practice Russian')
  })

  it('falls back to New chat for empty titles', () => {
    expect(getChatHeaderDisplayTitle('')).toBe('New chat')
    expect(getChatHeaderDisplayTitle('   ')).toBe('New chat')
    expect(getChatHeaderDisplayTitle(null)).toBe('New chat')
  })
})
