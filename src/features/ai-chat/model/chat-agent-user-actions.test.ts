import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatsStore } from '@/entities/chat/model/store'
import { useMessageQueueStore } from '@/entities/message-queue/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { setAgentStreamSession } from '@/features/ai-chat/lib/agent-stream-session'
import { setPipelineStageForChat } from '@/features/ai-chat/lib/pipeline-stage'
import { sendUserMessageAction } from '@/features/ai-chat/model/chat-agent-user-actions'
import type { ChatAgentUserActionsDeps } from '@/features/ai-chat/model/chat-agent-user-actions'

const chatId = 'actions-chat'

function createDeps(overrides: Partial<ChatAgentUserActionsDeps> = {}): ChatAgentUserActionsDeps {
  return {
    addMessage: vi.fn(() => 'msg-new'),
    removeMessagesFrom: vi.fn(),
    removeMessagesAfter: vi.fn(),
    updateUserMessageContent: vi.fn(),
    updateMessageContent: vi.fn(),
    stopAgent: vi.fn(),
    runAssistantReply: vi.fn(async () => true),
    enqueueUserMessage: vi.fn(),
    setBlurAnimateMessageId: vi.fn(),
    setError: vi.fn(),
    ...overrides
  }
}

describe('chat-agent-user-actions', () => {
  beforeEach(() => {
    setAgentStreamSession(null, false)
    useChatsStore.setState({
      chats: [
        {
          id: chatId,
          title: 'Test',
          messages: [],
          createdAt: 0,
          updatedAt: 0
        }
      ],
      activeChatId: chatId
    })
    useMessageQueueStore.setState({ byChatId: {} })
    useConversationStore.setState({ stage: 'idle', error: null, speechError: null })
    setPipelineStageForChat(chatId, 'thinking')
  })

  it('sendUserMessageAction enqueues when agent turn is deferred', async () => {
    const deps = createDeps()
    await sendUserMessageAction(deps, 'Follow up', undefined)

    expect(deps.enqueueUserMessage).toHaveBeenCalledWith('Follow up', chatId, undefined)
    expect(deps.addMessage).not.toHaveBeenCalled()
    expect(deps.runAssistantReply).not.toHaveBeenCalled()
  })

  it('sendUserMessageAction runs turn when idle', async () => {
    setPipelineStageForChat(chatId, 'idle')
    const deps = createDeps()

    await sendUserMessageAction(deps, 'Hello', undefined)

    expect(deps.stopAgent).toHaveBeenCalledWith({ chatId })
    expect(deps.addMessage).toHaveBeenCalled()
    expect(deps.runAssistantReply).toHaveBeenCalledWith(chatId)
    expect(deps.enqueueUserMessage).not.toHaveBeenCalled()
  })
})
