import { beforeEach, describe, expect, it } from 'vitest'
import { useChatsStore } from '@/entities/chat/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { setAgentStreamSession } from '@/features/ai-chat/lib/agent-stream-session'
import { isChatAgentBusy } from '@/features/ai-chat/lib/chat-agent-busy'
import { setPipelineStageForChat } from '@/features/ai-chat/lib/pipeline-stage'

describe('isChatAgentBusy', () => {
  beforeEach(() => {
    setAgentStreamSession(null, false)
    useConversationStore.setState({
      stage: 'idle',
      error: null,
      speechError: null,
      pipelineThinkingText: '',
      pipelineSearchTargets: [],
      pipelineStreamingAnswer: false
    })
  })

  it('is false for idle chat while another chat streams', () => {
    const chatA = 'chat-a'
    const chatB = 'chat-b'
    useChatsStore.setState({
      chats: [
        { id: chatA, title: 'A', messages: [], updatedAt: 0, createdAt: 0 },
        { id: chatB, title: 'B', messages: [], updatedAt: 0, createdAt: 0 }
      ],
      activeChatId: chatB
    })

    setAgentStreamSession(chatA, true)
    setPipelineStageForChat(chatA, 'thinking')

    expect(isChatAgentBusy(chatA)).toBe(true)
    expect(isChatAgentBusy(chatB)).toBe(false)
  })
})
