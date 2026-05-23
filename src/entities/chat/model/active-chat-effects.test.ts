import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearActiveChatChangeHandlers,
  notifyActiveChatChange,
  registerActiveChatChangeHandler
} from './active-chat-effects'

describe('active-chat-change handlers', () => {
  beforeEach(() => {
    clearActiveChatChangeHandlers()
  })

  it('runs all registered handlers on notify', () => {
    const a = vi.fn()
    const b = vi.fn()
    registerActiveChatChangeHandler(a)
    registerActiveChatChangeHandler(b)
    notifyActiveChatChange()
    expect(a).toHaveBeenCalledOnce()
    expect(b).toHaveBeenCalledOnce()
  })
})
