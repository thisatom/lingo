import { describe, expect, it } from 'vitest'
import { useMessageQueueStore } from '@/entities/message-queue/model/store'
import { executeAgentStop } from '@/features/ai-chat/lib/chat-agent-stop'
import { isChatAgentBusy } from '@/features/ai-chat/lib/chat-agent-busy'
import { setPipelineStageForChat } from '@/features/ai-chat/lib/pipeline-stage'
import { setAgentStreamSession } from '@/features/ai-chat/lib/agent-stream-session'
import { shouldAutoFlushMessageQueue } from './chat-agent-queue'

describe('shouldAutoFlushMessageQueue', () => {
  it('allows flush when idle and queue has items', () => {
    expect(
      shouldAutoFlushMessageQueue({
        chatId: 'c1',
        agentBusy: false,
        queueLength: 2,
        deferTurn: false
      })
    ).toBe(true)
  })

  it('blocks flush while agent is busy', () => {
    expect(
      shouldAutoFlushMessageQueue({
        chatId: 'c1',
        agentBusy: true,
        queueLength: 1,
        deferTurn: false
      })
    ).toBe(false)
  })

  it('blocks flush after force stop cleared the queue', () => {
    const chatId = 'c1'
    useMessageQueueStore.getState().enqueue(chatId, 'follow up')
    setAgentStreamSession(chatId, true)
    setPipelineStageForChat(chatId, 'thinking')
    expect(isChatAgentBusy(chatId)).toBe(true)

    executeAgentStop(
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

    expect(useMessageQueueStore.getState().getQueue(chatId)).toHaveLength(0)
    expect(
      shouldAutoFlushMessageQueue({
        chatId,
        agentBusy: isChatAgentBusy(chatId),
        queueLength: useMessageQueueStore.getState().getQueue(chatId).length,
        deferTurn: false
      })
    ).toBe(false)
  })
})
