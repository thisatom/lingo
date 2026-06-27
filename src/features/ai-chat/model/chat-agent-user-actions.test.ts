import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatsStore } from '@/entities/chat/model/store'
import { useMessageQueueStore } from '@/entities/message-queue/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { setAgentStreamSession } from '@/features/ai-chat/lib/agent-stream-session'
import { setPipelineStageForChat } from '@/features/ai-chat/lib/pipeline-stage'
import { setAgentStreamSession } from '@/features/ai-chat/lib/agent-stream-session'
import {
  commitVoiceUserMessageAction,
  continueAssistantMessageAction,
  sendQueuedMessageNowAction,
  sendUserMessageAction,
  updateVoiceUserMessageAction
} from '@/features/ai-chat/model/chat-agent-user-actions'
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
    runAssistantContinuation: vi.fn(async () => true),
    enqueueUserMessage: vi.fn(),
    setBlurAnimateMessageId: vi.fn(),
    setError: vi.fn(),
    ...overrides
  }
}

describe('chat-agent-user-actions', () => {
  beforeEach(() => {
    setAgentStreamSession(null, false)
    useChatsStore.getState().resetChats()
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

  it('updateVoiceUserMessageAction writes to the capture chat, not active chat', () => {
    const otherChatId = 'other-chat'
    useChatsStore.setState({
      chats: [
        {
          id: chatId,
          title: 'Capture',
          messages: [{ id: 'voice-1', role: 'user', content: '', createdAt: 0 }],
          createdAt: 0,
          updatedAt: 0
        },
        {
          id: otherChatId,
          title: 'Other',
          messages: [],
          createdAt: 0,
          updatedAt: 0
        }
      ],
      activeChatId: otherChatId
    })
    const deps = createDeps()
    updateVoiceUserMessageAction(deps, 'voice-1', 'Hello', chatId)

    expect(deps.updateMessageContent).toHaveBeenCalledWith('voice-1', 'Hello', chatId, {
      allowEmptyUser: true
    })
  })

  it('commitVoiceUserMessageAction runs turn on capture chat after active chat changed', async () => {
    const otherChatId = 'other-chat'
    useChatsStore.setState({
      chats: [
        {
          id: chatId,
          title: 'Capture',
          messages: [{ id: 'voice-1', role: 'user', content: 'Hi', createdAt: 0 }],
          createdAt: 0,
          updatedAt: 0
        },
        {
          id: otherChatId,
          title: 'Other',
          messages: [],
          createdAt: 0,
          updatedAt: 0
        }
      ],
      activeChatId: otherChatId
    })
    setPipelineStageForChat(chatId, 'idle')
    const deps = createDeps()

    await commitVoiceUserMessageAction(deps, 'voice-1', chatId)

    expect(deps.runAssistantReply).toHaveBeenCalledWith(chatId)
  })

  it('sendQueuedMessageNowAction blocks when another chat is streaming', async () => {
    const otherChatId = 'other-stream-chat'
    useChatsStore.setState({
      chats: [
        {
          id: chatId,
          title: 'Test',
          messages: [],
          createdAt: 0,
          updatedAt: 0
        },
        {
          id: otherChatId,
          title: 'Other',
          messages: [],
          createdAt: 0,
          updatedAt: 0
        }
      ],
      activeChatId: chatId
    })
    setAgentStreamSession(otherChatId, true)
    useMessageQueueStore.getState().enqueue(chatId, 'Queued follow-up')
    const queueItemId = useMessageQueueStore.getState().getQueue(chatId)[0]!.id
    const deps = createDeps()

    await sendQueuedMessageNowAction(deps, queueItemId)

    expect(deps.setError).toHaveBeenCalled()
    expect(deps.stopAgent).not.toHaveBeenCalled()
    expect(deps.runAssistantReply).not.toHaveBeenCalled()
    expect(useMessageQueueStore.getState().getQueue(chatId)).toHaveLength(1)
  })

  it('sendQueuedMessageNowAction uses scoped stop, not force', async () => {
    setPipelineStageForChat(chatId, 'idle')
    useMessageQueueStore.getState().enqueue(chatId, 'Queued follow-up')
    const queueItemId = useMessageQueueStore.getState().getQueue(chatId)[0]!.id
    const deps = createDeps()

    await sendQueuedMessageNowAction(deps, queueItemId)

    expect(deps.stopAgent).toHaveBeenCalledWith({ chatId })
    expect(deps.runAssistantReply).toHaveBeenCalledWith(chatId)
  })

  it('continueAssistantMessageAction resumes in place with stored prefix', async () => {
    setPipelineStageForChat(chatId, 'idle')
    useChatsStore.setState({
      chats: [
        {
          id: chatId,
          title: 'Test',
          messages: [
            {
              id: 'u1',
              role: 'user',
              content: 'Tell me a story',
              createdAt: 0
            },
            {
              id: 'a1',
              role: 'assistant',
              content: 'Once upon a time',
              createdAt: 1,
              replyStatus: 'interrupted'
            }
          ],
          createdAt: 0,
          updatedAt: 0
        }
      ],
      activeChatId: chatId
    })
    const deps = createDeps()

    await continueAssistantMessageAction(deps, 'a1')

    expect(deps.stopAgent).toHaveBeenCalledWith({ chatId })
    expect(deps.runAssistantContinuation).toHaveBeenCalledWith(
      chatId,
      'a1',
      'Once upon a time'
    )
  })

  it('sendUserMessageAction creates the first chat when none exist', async () => {
    useChatsStore.getState().resetChats()
    setPipelineStageForChat('unused', 'idle')
    const deps = createDeps()

    await sendUserMessageAction(deps, 'Hello world', undefined)

    expect(useChatsStore.getState().chats).toHaveLength(1)
    expect(deps.addMessage).toHaveBeenCalled()
    expect(deps.runAssistantReply).toHaveBeenCalledWith(useChatsStore.getState().chats[0]!.id)
  })
})
