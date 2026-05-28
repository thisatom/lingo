import { describe, expect, it } from 'vitest'
import {
  buildChatTailScrollSignature,
  isViewportNearChatBottom,
  shouldStickToBottom
} from './chat-scroll-follow'

describe('shouldStickToBottom', () => {
  it('returns false while restoring', () => {
    expect(shouldStickToBottom({ pinToBottom: true, isRestoring: true })).toBe(false)
  })

  it('follows when pinned', () => {
    expect(shouldStickToBottom({ pinToBottom: true, isRestoring: false })).toBe(true)
  })

  it('follows during an active agent reply', () => {
    expect(
      shouldStickToBottom({ pinToBottom: false, isRestoring: false, agentReplyActive: true })
    ).toBe(true)
  })

  it('follows near bottom only with a viewport', () => {
    const viewport = {
      scrollHeight: 1000,
      clientHeight: 400,
      scrollTop: 570
    } as HTMLElement
    expect(shouldStickToBottom({ pinToBottom: false, isRestoring: false }, viewport)).toBe(
      true
    )
    viewport.scrollTop = 500
    // maxScrollTop = 600; gap 100 > 32px threshold
    expect(shouldStickToBottom({ pinToBottom: false, isRestoring: false }, viewport)).toBe(
      false
    )
    expect(isViewportNearChatBottom(viewport)).toBe(false)
  })
})

describe('buildChatTailScrollSignature', () => {
  it('includes thinking length when assistant is last', () => {
    const sig = buildChatTailScrollSignature([
      { id: '1', role: 'user', content: 'hi' },
      { id: '2', role: 'thinking', content: 'reasoning…' },
      { id: '3', role: 'assistant', content: '' }
    ])
    expect(sig).toContain(':t10')
    expect(sig).toContain(':assistant')
  })
})
