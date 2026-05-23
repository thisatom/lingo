import { beforeEach, describe, expect, it } from 'vitest'
import { useChatsStore } from '@/entities/chat/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { getChatPipeline } from './chat-pipeline-registry'
import {
  isViewingChat,
  setPipelineErrorForChat,
  setPipelineStageForChat
} from './pipeline-stage'

describe('pipeline-stage', () => {
  beforeEach(() => {
    useConversationStore.setState({
      stage: 'idle',
      error: null,
      speechError: null,
      blurAnimateMessageId: null,
      blurAnimatedMessageIds: [],
      queueAheadPreview: null,
      pipelineThinkingText: '',
      pipelineSearchTargets: [],
      pipelineStreamingAnswer: false
    })
  })

  it('does not change stage when updating pipeline for a non-active chat', () => {
    const chatA = 'chat-a'
    const chatB = 'chat-b'
    useChatsStore.setState({
      chats: [
        { id: chatA, title: 'A', messages: [], updatedAt: 0, createdAt: 0 },
        { id: chatB, title: 'B', messages: [], updatedAt: 0, createdAt: 0 }
      ],
      activeChatId: chatA
    })

    setPipelineStageForChat(chatB, 'thinking')
    expect(useConversationStore.getState().stage).toBe('idle')
    expect(getChatPipeline(chatB).stage).toBe('thinking')
    expect(isViewingChat(chatA)).toBe(true)
    expect(isViewingChat(chatB)).toBe(false)
  })

  it('sets conversation error only when viewing the target chat', () => {
    const chatA = 'chat-a'
    const chatB = 'chat-b'
    useChatsStore.setState({
      chats: [
        { id: chatA, title: 'A', messages: [], updatedAt: 0, createdAt: 0 },
        { id: chatB, title: 'B', messages: [], updatedAt: 0, createdAt: 0 }
      ],
      activeChatId: chatA
    })

    setPipelineErrorForChat(chatB, 'API failed')
    expect(useConversationStore.getState().error).toBeNull()
    expect(useChatsStore.getState().chats.find((c) => c.id === chatB)?.hasError).toBe(true)
  })
})
