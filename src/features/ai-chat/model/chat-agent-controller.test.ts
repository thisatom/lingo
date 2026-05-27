import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatsStore } from '@/entities/chat/model/store'
import { useMessageQueueStore } from '@/entities/message-queue/model/store'
import { ChatAgentController } from '@/features/ai-chat/model/chat-agent-controller'
import { setAgentStreamSession } from '@/features/ai-chat/lib/agent-stream-session'
import { setPipelineStageForChat } from '@/features/ai-chat/lib/pipeline-stage'
import { markPendingAgentReply, resetPendingAgentReplies } from '@/features/ai-chat/lib/pending-agent-reply'

describe('ChatAgentController', () => {
  const chatId = 'controller-chat'
  const controller = new ChatAgentController()

  beforeEach(() => {
    resetPendingAgentReplies()
    setAgentStreamSession(null, false)
    useChatsStore.setState({
      chats: [{ id: chatId, title: 'T', messages: [], createdAt: 0, updatedAt: 0 }],
      activeChatId: chatId
    })
    useMessageQueueStore.setState({ byChatId: {} })
  })

  it('flushQueuedMessages does nothing after force stop emptied the queue', async () => {
    useMessageQueueStore.getState().enqueue(chatId, 'queued')
    setPipelineStageForChat(chatId, 'thinking')
    setAgentStreamSession(chatId, true)

    controller.stop(
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

    const runTurn = vi.fn(async () => true)
    await controller.flushQueuedMessages(chatId, runTurn)

    expect(runTurn).not.toHaveBeenCalled()
    expect(useMessageQueueStore.getState().getQueue(chatId)).toHaveLength(0)
  })

  it('flushQueuedMessages runs pending reply when idle', async () => {
    markPendingAgentReply(chatId)
    setPipelineStageForChat(chatId, 'idle')

    const runTurn = vi.fn(async () => true)
    await controller.flushQueuedMessages(chatId, runTurn)

    expect(runTurn).toHaveBeenCalledOnce()
    expect(runTurn).toHaveBeenCalledWith(chatId)
  })
})
