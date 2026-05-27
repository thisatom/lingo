import { describe, expect, it, beforeEach } from 'vitest'
import { resetAgentRunGeneration } from '@/features/ai-chat/model/agent-run'
import { useChatsStore } from '@/entities/chat/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useMessageQueueStore } from '@/entities/message-queue/model/store'
import {
  isAgentStreamActiveForChat,
  setAgentStreamSession
} from '@/features/ai-chat/lib/agent-stream-session'
import {
  hasPendingAgentReply,
  markPendingAgentReply,
  resetPendingAgentReplies
} from '@/features/ai-chat/lib/pending-agent-reply'
import { getChatPipeline } from '@/features/ai-chat/lib/chat-pipeline-registry'
import { isChatAgentBusy } from '@/features/ai-chat/lib/chat-agent-busy'
import { setPipelineStageForChat } from '@/features/ai-chat/lib/pipeline-stage'
import {
  chatIdsToClearOnForceStop,
  executeAgentStop,
  resolveAgentStopChatId,
  shouldProceedWithAgentStop
} from './chat-agent-stop'

describe('chat-agent-stop (pure helpers)', () => {
  it('scoped stop ignores other chat stream', () => {
    expect(
      shouldProceedWithAgentStop({
        force: false,
        streamChatId: 'chat-a',
        scopeChatId: 'chat-b'
      })
    ).toBe(false)
    expect(
      shouldProceedWithAgentStop({
        force: true,
        streamChatId: 'chat-a',
        scopeChatId: 'chat-b'
      })
    ).toBe(true)
  })

  it('resolveAgentStopChatId prefers stream then scope then active', () => {
    expect(
      resolveAgentStopChatId({
        streamChatId: 's',
        scopeChatId: 'c',
        activeChatId: 'a'
      })
    ).toBe('s')
    expect(
      resolveAgentStopChatId({
        streamChatId: null,
        scopeChatId: 'c',
        activeChatId: 'a'
      })
    ).toBe('c')
  })

  it('chatIdsToClearOnForceStop deduplicates ids', () => {
    expect(chatIdsToClearOnForceStop('x', 'x', 'y')).toEqual(['x', 'y'])
  })
})

describe('executeAgentStop', () => {
  const chatId = 'chat-stop-test'

  beforeEach(() => {
    resetAgentRunGeneration()
    resetPendingAgentReplies()
    useChatsStore.setState({
      chats: [{ id: chatId, title: 'T', messages: [], createdAt: 0, updatedAt: 0 }],
      activeChatId: chatId
    })
    useConversationStore.setState({
      stage: 'thinking',
      error: null,
      pipelineThinkingText: '',
      pipelineSearchTargets: [],
      pipelineStreamingAnswer: false
    })
    setAgentStreamSession(chatId, true)
    setPipelineStageForChat(chatId, 'speaking')
    useMessageQueueStore.getState().enqueue(chatId, 'queued follow-up')
    markPendingAgentReply(chatId)
  })

  it('force stop clears session, pipeline idle, queue and pending', () => {
    expect(isChatAgentBusy(chatId)).toBe(true)

    const ran = executeAgentStop(
      { force: true, chatId },
      {
        streamController: null,
        streamTargetChatId: chatId,
        streamingTts: null,
        setStreamController: () => undefined,
        setStreamTargetChatId: () => undefined,
        setStreamActive: () => undefined,
        setStreamingTts: () => undefined,
        setBlurAnimateMessageId: () => undefined,
        setGlobalStageIdle: () => undefined
      }
    )

    expect(ran).toBe(true)
    expect(isAgentStreamActiveForChat(chatId)).toBe(false)
    expect(getChatPipeline(chatId).stage).toBe('idle')
    expect(useConversationStore.getState().stage).toBe('idle')
    expect(useMessageQueueStore.getState().getQueue(chatId)).toHaveLength(0)
    expect(hasPendingAgentReply(chatId)).toBe(false)
    expect(isChatAgentBusy(chatId)).toBe(false)
  })
})
