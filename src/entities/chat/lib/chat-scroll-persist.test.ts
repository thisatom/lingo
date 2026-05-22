import { describe, expect, it } from 'vitest'
import {
  CHAT_SCROLL_MIN_PX,
  chatScrollFromLegacyChat,
  isValidChatScrollTop,
  normalizeChatScrollByChatId
} from './chat-scroll-persist'

describe('chat-scroll-persist', () => {
  it('treats scrollTop below minimum as invalid', () => {
    expect(isValidChatScrollTop(0)).toBe(false)
    expect(isValidChatScrollTop(CHAT_SCROLL_MIN_PX - 1)).toBe(false)
    expect(isValidChatScrollTop(CHAT_SCROLL_MIN_PX)).toBe(true)
    expect(isValidChatScrollTop(120)).toBe(true)
  })

  it('normalizes legacy anchor objects and drops invalid values', () => {
    expect(
      normalizeChatScrollByChatId({
        a: 40,
        b: 2,
        c: { scrollTop: 100 },
        d: { scrollTop: 1 }
      })
    ).toEqual({ a: 40, c: 100 })
  })

  it('reads legacy scroll from chat objects', () => {
    expect(chatScrollFromLegacyChat({ scrollAnchorScrollTop: 50 })).toBe(50)
    expect(chatScrollFromLegacyChat({ scrollAnchorScrollTop: 3 })).toBe(null)
    expect(chatScrollFromLegacyChat(null)).toBe(null)
  })
})
