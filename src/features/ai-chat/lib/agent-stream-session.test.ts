import { describe, expect, it } from 'vitest'
import {
  getBackgroundStreamChatId,
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
})
