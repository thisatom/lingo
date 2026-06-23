/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { bindChatBottomInset } from './sync-chat-bottom-inset'

describe('bindChatBottomInset', () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty('--lingo-chat-bottom-inset')
  })

  afterEach(() => {
    document.documentElement.style.removeProperty('--lingo-chat-bottom-inset')
  })

  it('sets CSS variable from element height', () => {
    const element = document.createElement('div')
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      height: 132,
      width: 0,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      toJSON: () => ({})
    })

    const unbind = bindChatBottomInset(element)
    expect(document.documentElement.style.getPropertyValue('--lingo-chat-bottom-inset')).toBe('132px')
    unbind()
    expect(document.documentElement.style.getPropertyValue('--lingo-chat-bottom-inset')).toBe('')
  })

  it('restores fallback when element is null', () => {
    const unbind = bindChatBottomInset(null)
    expect(document.documentElement.style.getPropertyValue('--lingo-chat-bottom-inset')).toBe('7rem')
    unbind()
  })
})
