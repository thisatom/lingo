import { describe, expect, it } from 'vitest'
import { wheelScrollsChatNestedTarget } from '@/shared/lib/chat-nested-scroll'

function mockNestedScrollEl(scrollTop: number) {
  return {
    scrollHeight: 400,
    clientHeight: 200,
    scrollTop,
    closest(selector: string) {
      return selector.includes('data-chat-nested-scroll') ? this : null
    }
  }
}

describe('wheelScrollsChatNestedTarget', () => {
  it('returns true when wheel can scroll nested content down', () => {
    const nested = mockNestedScrollEl(0)
    expect(wheelScrollsChatNestedTarget(nested as unknown as EventTarget, 40)).toBe(true)
  })

  it('returns false for plain chat text', () => {
    const p = { closest: () => null }
    expect(wheelScrollsChatNestedTarget(p as unknown as EventTarget, -40)).toBe(false)
  })
})
