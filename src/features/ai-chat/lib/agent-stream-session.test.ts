import { describe, expect, it } from 'vitest'
import {
  getBackgroundStreamChatId,
  isAgentStreamActiveForChat,
  setAgentStreamSession
} from './agent-stream-session'

describe('agent-stream-session', () => {
  it('reports background stream when active chat differs', () => {
    setAgentStreamSession('chat-a', true)
    expect(getBackgroundStreamChatId('chat-b')).toBe('chat-a')
    expect(getBackgroundStreamChatId('chat-a')).toBeNull()
    setAgentStreamSession(null, false)
    expect(getBackgroundStreamChatId('chat-b')).toBeNull()
  })

  it('tracks stream activity per chat id', () => {
    setAgentStreamSession('chat-a', true)
    expect(isAgentStreamActiveForChat('chat-a')).toBe(true)
    expect(isAgentStreamActiveForChat('chat-b')).toBe(false)
    setAgentStreamSession(null, false)
    expect(isAgentStreamActiveForChat('chat-a')).toBe(false)
  })
})
