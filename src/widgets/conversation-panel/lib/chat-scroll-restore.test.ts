import { describe, expect, it } from 'vitest'
import {
  buildScrollRestoreSessionKey,
  shouldSkipScrollRestore
} from './chat-scroll-restore'

describe('chat-scroll-restore', () => {
  it('builds a stable session key without turn count', () => {
    expect(buildScrollRestoreSessionKey('chat-1', 120)).toBe('chat-1:120')
    expect(buildScrollRestoreSessionKey('chat-1', null)).toBe('chat-1:bottom')
  })

  it('skips restore only when the same session already completed', () => {
    expect(shouldSkipScrollRestore('chat-1:120', 'chat-1:120')).toBe(true)
    expect(shouldSkipScrollRestore('chat-1:120', 'chat-1:121')).toBe(false)
    expect(shouldSkipScrollRestore(null, 'chat-1:bottom')).toBe(false)
  })
})
