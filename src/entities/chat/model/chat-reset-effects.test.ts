import { describe, expect, it } from 'vitest'
import { notifyChatsReset, registerChatsResetHandler, clearChatsResetHandlers } from './chat-reset-effects'

describe('chat-reset-effects', () => {
  it('notifies registered reset handlers', () => {
    clearChatsResetHandlers()
    let called = 0
    registerChatsResetHandler(() => {
      called += 1
    })
    notifyChatsReset()
    expect(called).toBe(1)
    clearChatsResetHandlers()
  })
})
