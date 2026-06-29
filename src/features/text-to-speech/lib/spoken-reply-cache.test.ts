import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearSpokenReplyCache,
  getSpeechContentKey,
  hasSpokenReply,
  markReplySpoken
} from './spoken-reply-cache'

describe('spoken-reply-cache', () => {
  beforeEach(() => {
    clearSpokenReplyCache()
  })

  it('tracks spoken reply keys', () => {
    expect(hasSpokenReply('Hello')).toBe(false)
    markReplySpoken('Hello')
    expect(hasSpokenReply('Hello')).toBe(true)
    expect(hasSpokenReply('  Hello  ')).toBe(true)
  })

  it('normalizes keys with trim', () => {
    expect(getSpeechContentKey('  hi  ')).toBe('hi')
  })
})
