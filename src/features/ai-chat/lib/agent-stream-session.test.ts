import { describe, expect, it } from 'vitest'
import {
  endAgentTurnStreamBinding,
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

  it('endAgentTurnStreamBinding clears global stream when turn owned the binding', () => {
    const session = {
      streamTarget: 'chat-a' as string | null,
      getStreamTargetChatId() {
        return this.streamTarget
      },
      setStreamController() {},
      setStreamTargetChatId(chatId: string | null) {
        this.streamTarget = chatId
      },
      setStreamActive() {}
    }
    setAgentStreamSession('chat-a', true)

    endAgentTurnStreamBinding('chat-a', session)

    expect(session.streamTarget).toBeNull()
    expect(isAgentStreamActiveForChat('chat-a')).toBe(false)
  })
})
