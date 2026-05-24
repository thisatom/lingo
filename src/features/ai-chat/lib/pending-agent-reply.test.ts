import { describe, expect, it } from 'vitest'
import {
  consumePendingAgentReply,
  hasPendingAgentReply,
  markPendingAgentReply,
  resetPendingAgentReplies
} from './pending-agent-reply'

describe('pending-agent-reply', () => {
  it('marks and consumes a pending reply for a chat', () => {
    resetPendingAgentReplies()
    markPendingAgentReply('chat-a')
    expect(hasPendingAgentReply('chat-a')).toBe(true)
    expect(consumePendingAgentReply('chat-a')).toBe(true)
    expect(hasPendingAgentReply('chat-a')).toBe(false)
  })
})
