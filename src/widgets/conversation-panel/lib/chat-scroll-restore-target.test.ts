import { describe, expect, it } from 'vitest'
import { mergeChatScrollRestoreTarget } from './chat-scroll-restore-target'

describe('mergeChatScrollRestoreTarget', () => {
  it('replaces target when chat id changes', () => {
    const result = mergeChatScrollRestoreTarget(
      { chatId: 'a', scrollTop: 100 },
      'b',
      200,
      true
    )
    expect(result).toEqual({
      target: { chatId: 'b', scrollTop: 200 },
      lateHydration: false
    })
  })

  it('fills scrollTop after hydration on the same chat', () => {
    const result = mergeChatScrollRestoreTarget(
      { chatId: 'a', scrollTop: null },
      'a',
      180,
      true
    )
    expect(result).toEqual({
      target: { chatId: 'a', scrollTop: 180 },
      lateHydration: true
    })
  })

  it('keeps existing target when scrollTop already set', () => {
    const current = { chatId: 'a', scrollTop: 120 }
    const result = mergeChatScrollRestoreTarget(current, 'a', 999, true)
    expect(result).toEqual({ target: current, lateHydration: false })
  })
})
