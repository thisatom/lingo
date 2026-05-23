import { beforeEach, describe, expect, it } from 'vitest'
import { useChatsStore } from '@/entities/chat/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import {
  clearChatPipeline,
  getChatPipeline,
  patchChatPipeline,
  syncPipelineUiForActiveChat
} from './chat-pipeline-registry'
import { setPipelineErrorForChat, setPipelineStageForChat } from './pipeline-stage'

describe('chat-pipeline-registry', () => {
  beforeEach(() => {
    useConversationStore.setState({
      stage: 'idle',
      error: null as string | null,
      speechError: null,
      blurAnimateMessageId: null,
      blurAnimatedMessageIds: [],
      queueAheadPreview: null,
      pipelineThinkingText: '',
      pipelineSearchTargets: [],
      pipelineStreamingAnswer: false
    })
  })

  it('keeps pipeline per chat and restores UI when switching back', () => {
    const chatA = 'chat-a'
    const chatB = 'chat-b'
    useChatsStore.setState({
      chats: [
        { id: chatA, title: 'A', messages: [], updatedAt: 0, createdAt: 0 },
        { id: chatB, title: 'B', messages: [], updatedAt: 0, createdAt: 0 }
      ],
      activeChatId: chatA
    })

    setPipelineStageForChat(chatA, 'thinking')
    patchChatPipeline(chatA, { pipelineStreamingAnswer: true })

    useChatsStore.getState().selectChat(chatB)
    syncPipelineUiForActiveChat()
    expect(useConversationStore.getState().stage).toBe('idle')

    setPipelineStageForChat(chatB, 'searching')
    useChatsStore.getState().selectChat(chatA)
    syncPipelineUiForActiveChat()

    expect(getChatPipeline(chatA).stage).toBe('thinking')
    expect(useConversationStore.getState().stage).toBe('thinking')
    expect(useConversationStore.getState().pipelineStreamingAnswer).toBe(true)
  })

  it('restores per-chat error when switching chats', () => {
    const chatA = 'chat-a'
    const chatB = 'chat-b'
    useChatsStore.setState({
      chats: [
        { id: chatA, title: 'A', messages: [], updatedAt: 0, createdAt: 0 },
        { id: chatB, title: 'B', messages: [], updatedAt: 0, createdAt: 0 }
      ],
      activeChatId: chatA
    })

    setPipelineErrorForChat(chatA, 'Failed on A')
    useChatsStore.getState().selectChat(chatB)
    syncPipelineUiForActiveChat()
    expect(useConversationStore.getState().error).toBeNull()

    useChatsStore.getState().selectChat(chatA)
    syncPipelineUiForActiveChat()
    expect(useConversationStore.getState().error).toBe('Failed on A')
  })

  it('clearChatPipeline drops snapshot', () => {
    patchChatPipeline('gone', { stage: 'thinking' })
    clearChatPipeline('gone')
    expect(getChatPipeline('gone').stage).toBe('idle')
  })
})
