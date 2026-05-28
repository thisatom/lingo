import { describe, expect, it } from 'vitest'
import { useChatsStore } from '@/entities/chat/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { beginAgentRun, cancelAgentRun, isAgentRunActive } from '@/features/ai-chat/model/agent-run'
import { setAgentStreamSession } from '@/features/ai-chat/lib/agent-stream-session'
import { setPipelineStageForChat } from '@/features/ai-chat/lib/pipeline-stage'
import {
  finalizeAgentTurnPipeline,
  releaseStaleAgentPipelineStage
} from '@/features/ai-chat/lib/release-stale-agent-pipeline'

describe('releaseStaleAgentPipelineStage', () => {
  it('clears speaking when no stream is active for the chat', () => {
    const chatId = 'chat-a'
    useChatsStore.setState({
      chats: [{ id: chatId, title: 'Test', messages: [], createdAt: 0, updatedAt: 0 }],
      activeChatId: chatId
    })
    setPipelineStageForChat(chatId, 'speaking')
    setAgentStreamSession(null, false)

    releaseStaleAgentPipelineStage(chatId)

    expect(useConversationStore.getState().stage).toBe('idle')
  })

  it('does not clear while another run still streams on the same chat', () => {
    const chatId = 'chat-b'
    useChatsStore.setState({
      chats: [{ id: chatId, title: 'Test', messages: [], createdAt: 0, updatedAt: 0 }],
      activeChatId: chatId
    })
    setPipelineStageForChat(chatId, 'thinking')
    setAgentStreamSession(chatId, true)

    releaseStaleAgentPipelineStage(chatId)

    expect(useConversationStore.getState().stage).toBe('thinking')
  })

  it('clears speaking for superseded run when stream session ended', () => {
    const chatId = 'chat-supersede'
    useChatsStore.setState({
      chats: [{ id: chatId, title: 'Test', messages: [], createdAt: 0, updatedAt: 0 }],
      activeChatId: chatId
    })

    const run1 = beginAgentRun()
    setPipelineStageForChat(chatId, 'speaking')
    setAgentStreamSession(chatId, true)

    cancelAgentRun()
    setAgentStreamSession(null, false)
    expect(isAgentRunActive(run1)).toBe(false)

    releaseStaleAgentPipelineStage(chatId)

    expect(useConversationStore.getState().stage).toBe('idle')
  })
})

describe('finalizeAgentTurnPipeline', () => {
  it('forces idle after turn ends when no stream is active', () => {
    const chatId = 'chat-finalize'
    useChatsStore.setState({
      chats: [{ id: chatId, title: 'Test', messages: [], createdAt: 0, updatedAt: 0 }],
      activeChatId: chatId
    })
    setPipelineStageForChat(chatId, 'speaking')
    setAgentStreamSession(null, false)

    finalizeAgentTurnPipeline(chatId)

    expect(useConversationStore.getState().stage).toBe('idle')
  })

  it('does not clear while a new stream started on the same chat', () => {
    const chatId = 'chat-finalize-stream'
    useChatsStore.setState({
      chats: [{ id: chatId, title: 'Test', messages: [], createdAt: 0, updatedAt: 0 }],
      activeChatId: chatId
    })
    setPipelineStageForChat(chatId, 'thinking')
    setAgentStreamSession(chatId, true)

    finalizeAgentTurnPipeline(chatId)

    expect(useConversationStore.getState().stage).toBe('thinking')
  })
})
