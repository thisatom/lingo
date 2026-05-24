import { beforeEach, describe, expect, it } from 'vitest'
import { useChatsStore } from '@/entities/chat/model/store'
import { setAgentStreamSession } from '@/features/ai-chat/lib/agent-stream-session'
import { setPipelineStageForChat } from '@/features/ai-chat/lib/pipeline-stage'
import {
  getOtherChatStreamBlocking,
  shouldDeferChatAgentTurn
} from '@/features/ai-chat/lib/agent-stream-guard'

describe('agent-stream-guard', () => {
  beforeEach(() => {
    setAgentStreamSession(null, false)
    useChatsStore.setState({
      chats: [
        { id: 'chat-a', title: 'A', messages: [], updatedAt: 0, createdAt: 0 },
        { id: 'chat-b', title: 'B', messages: [], updatedAt: 0, createdAt: 0 }
      ],
      activeChatId: 'chat-b'
    })
  })

  it('detects a stream in another chat', () => {
    setAgentStreamSession('chat-a', true)
    expect(getOtherChatStreamBlocking('chat-b')).toBe('chat-a')
    expect(getOtherChatStreamBlocking('chat-a')).toBeNull()
  })

  it('defers turns while another chat streams', () => {
    setAgentStreamSession('chat-a', true)
    expect(shouldDeferChatAgentTurn('chat-b')).toBe(true)
  })

  it('defers turns while the same chat is busy', () => {
    setPipelineStageForChat('chat-b', 'thinking')
    expect(shouldDeferChatAgentTurn('chat-b')).toBe(true)
  })
})
