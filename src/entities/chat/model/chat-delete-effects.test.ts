import { describe, expect, it, vi } from 'vitest'
import {
  clearChatDeletedHandlers,
  notifyChatDeleted,
  registerChatDeletedHandler
} from './chat-delete-effects'

describe('chat-delete-effects', () => {
  it('notifies every registered delete handler', () => {
    clearChatDeletedHandlers()
    const first = vi.fn()
    const second = vi.fn()
    registerChatDeletedHandler(first)
    registerChatDeletedHandler(second)

    notifyChatDeleted('chat-1')

    expect(first).toHaveBeenCalledWith('chat-1')
    expect(second).toHaveBeenCalledWith('chat-1')
  })
})
