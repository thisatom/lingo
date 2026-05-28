import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useChatsStore } from '@/entities/chat/model/store'
import {
  EMPTY_MESSAGE_QUEUE,
  useMessageQueueStore
} from '@/entities/message-queue/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import type { AgentStopOptions } from '@/features/ai-chat/lib/chat-agent-stop'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { EMPTY_MESSAGES } from '@/entities/message/model/types'
import '@/features/ai-chat/lib/chat-pipeline-registry'
import { getBackgroundStreamChatId } from '@/features/ai-chat/lib/agent-stream-session'
import { setPipelineErrorForChat } from '@/features/ai-chat/lib/pipeline-stage'
import {
  getAgentSessionSnapshotForView,
  isAgentSessionBusy
} from '@/features/ai-chat/lib/agent-session-snapshot'
import type { AgentTurnPhase } from '@/features/ai-chat/lib/chat-agent-transitions'
import {
  ChatAgentController,
  type AgentTurnSession
} from '@/features/ai-chat/model/chat-agent-controller'
import {
  buildAgentStopContext,
  buildAgentTurnSession,
  createGlobalStageIdleCallback,
  getSharedAgentChatSessionRefs
} from '@/features/ai-chat/model/agent-chat-session'
import {
  beginVoiceUserMessageAction,
  cancelVoiceUserMessageAction,
  commitVoiceUserMessageAction,
  regenerateAssistantMessageAction,
  retryLastRequestAction,
  sendQueuedMessageNowAction,
  sendUserMessageAction,
  submitEditedUserMessageAction,
  updateVoiceUserMessageAction,
  type ChatAgentUserActionsDeps
} from '@/features/ai-chat/model/chat-agent-user-actions'
import type { SubmitEditedUserMessageResult } from './submit-edited-user-message'

export type { SubmitEditedUserMessageResult } from './submit-edited-user-message'
export type StopAgentOptions = AgentStopOptions

type UseAiChatOptions = {
  /** Agent Speech: reopen mic after the assistant turn (with or without TTS). */
  onLiveConversationTurnComplete?: () => void
}

const chatAgentController = new ChatAgentController()

export function useAiChat(options: UseAiChatOptions = {}) {
  const activeChat = useChatsStore((s) => s.getActiveChat())
  const addMessage = useChatsStore((s) => s.addMessage)
  const removeMessagesFrom = useChatsStore((s) => s.removeMessagesFrom)
  const removeMessagesAfter = useChatsStore((s) => s.removeMessagesAfter)
  const updateUserMessageContent = useChatsStore((s) => s.updateUserMessageContent)
  const updateMessageContent = useChatsStore((s) => s.updateMessageContent)
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const chatComposerMode = useSettingsStore((s) => s.chatComposerMode)
  const stage = useConversationStore((s) => s.stage)
  const setStage = useConversationStore((s) => s.setStage)
  const setBlurAnimateMessageId = useConversationStore((s) => s.setBlurAnimateMessageId)

  const setError = useCallback((error: string | null, targetChatId?: string) => {
    const chatId = targetChatId ?? useChatsStore.getState().activeChatId
    if (!chatId) return
    setPipelineErrorForChat(chatId, error)
  }, [])

  const sessionRefs = getSharedAgentChatSessionRefs()
  const prevActiveChatIdRef = useRef<string | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const buildSession = useCallback(
    (): AgentTurnSession => buildAgentTurnSession(sessionRefs),
    [sessionRefs]
  )

  const buildStopContext = useCallback(
    () =>
      buildAgentStopContext(sessionRefs, {
        setBlurAnimateMessageId,
        setGlobalStageIdle: createGlobalStageIdleCallback(setStage)
      }),
    [sessionRefs, setBlurAnimateMessageId, setStage]
  )

  const runAssistantReplyRef = useRef<(chatId: string) => Promise<boolean>>(async () => false)

  const runAssistantReply = useCallback(
    async (targetChatId: string): Promise<boolean> => {
      return chatAgentController.runTurn({
        targetChatId,
        session: buildSession(),
        practiceLanguage,
        chatComposerMode,
        onLiveConversationTurnComplete: optionsRef.current.onLiveConversationTurnComplete,
        setBlurAnimateMessageId,
        setError,
        processNextInQueue: (chatId) =>
          chatAgentController.processNextInQueue(chatId, runAssistantReplyRef.current),
        tryRunPendingAgentReply: (chatId) =>
          chatAgentController.tryRunPendingAgentReply(chatId, runAssistantReplyRef.current)
      })
    },
    [buildSession, practiceLanguage, chatComposerMode, setBlurAnimateMessageId, setError]
  )

  useEffect(() => {
    runAssistantReplyRef.current = runAssistantReply
  })

  const stopAgent = useCallback(
    (stopOptions: StopAgentOptions = {}) => {
      chatAgentController.stop(stopOptions, buildStopContext())
    },
    [buildStopContext]
  )

  const userActionsDeps = useMemo<ChatAgentUserActionsDeps>(
    () => ({
      addMessage,
      removeMessagesFrom,
      removeMessagesAfter,
      updateUserMessageContent,
      updateMessageContent,
      stopAgent,
      runAssistantReply,
      enqueueUserMessage: (content, chatId, attachments) => {
        useMessageQueueStore.getState().enqueue(chatId, content, attachments)
      },
      setBlurAnimateMessageId,
      setError
    }),
    [
      addMessage,
      removeMessagesFrom,
      removeMessagesAfter,
      updateUserMessageContent,
      updateMessageContent,
      stopAgent,
      runAssistantReply,
      setBlurAnimateMessageId,
      setError
    ]
  )

  const messages = activeChat?.messages ?? EMPTY_MESSAGES
  const activeChatId = activeChat?.id ?? null

  useEffect(() => {
    const previous = prevActiveChatIdRef.current
    if (previous && previous !== activeChatId) {
      chatAgentController.stop({ chatId: previous, force: true }, buildStopContext())
    }
    prevActiveChatIdRef.current = activeChatId
  }, [activeChatId, buildStopContext])

  const agentSession = useMemo(
    () => getAgentSessionSnapshotForView(activeChatId, stage),
    [activeChatId, stage]
  )
  const agentBusy = isAgentSessionBusy(agentSession)
  const agentPhase: AgentTurnPhase = agentSession.phase
  const queuedMessages = useMessageQueueStore((s) =>
    activeChatId ? (s.byChatId[activeChatId] ?? EMPTY_MESSAGE_QUEUE) : EMPTY_MESSAGE_QUEUE
  )

  const enqueueUserMessage = useCallback(
    (content: string, chatId: string, attachments?: MessageAttachment[]) => {
      useMessageQueueStore.getState().enqueue(chatId, content, attachments)
    },
    []
  )

  const updateQueuedMessage = useCallback((id: string, content: string) => {
    const chatId = useChatsStore.getState().activeChatId
    if (!chatId) return
    useMessageQueueStore.getState().update(chatId, id, content)
  }, [])

  const removeQueuedMessage = useCallback((id: string) => {
    const chatId = useChatsStore.getState().activeChatId
    if (!chatId) return
    useMessageQueueStore.getState().remove(chatId, id)
  }, [])

  const sendQueuedMessageNow = useCallback(
    (id: string) => sendQueuedMessageNowAction(userActionsDeps, id),
    [userActionsDeps]
  )

  const flushQueuedMessages = useCallback(
    async (chatId?: string) => {
      await chatAgentController.flushQueuedMessages(chatId, runAssistantReplyRef.current)
    },
    []
  )

  const sendUserMessage = useCallback(
    (content: string, attachments?: MessageAttachment[]) =>
      sendUserMessageAction(userActionsDeps, content, attachments),
    [userActionsDeps]
  )

  const beginVoiceUserMessage = useCallback(
    () => beginVoiceUserMessageAction(userActionsDeps),
    [userActionsDeps]
  )

  const updateVoiceUserMessage = useCallback(
    (messageId: string, content: string, chatId: string) =>
      updateVoiceUserMessageAction(userActionsDeps, messageId, content, chatId),
    [userActionsDeps]
  )

  const cancelVoiceUserMessage = useCallback(
    (messageId: string, chatId: string) =>
      cancelVoiceUserMessageAction(userActionsDeps, messageId, chatId),
    [userActionsDeps]
  )

  const commitVoiceUserMessage = useCallback(
    (messageId: string, chatId: string) =>
      commitVoiceUserMessageAction(userActionsDeps, messageId, chatId),
    [userActionsDeps]
  )

  const submitEditedUserMessage = useCallback(
    (messageId: string, content: string, attachments?: MessageAttachment[]) =>
      submitEditedUserMessageAction(userActionsDeps, messageId, content, attachments),
    [userActionsDeps]
  )

  const regenerateAssistantMessage = useCallback(
    (messageId: string) => regenerateAssistantMessageAction(userActionsDeps, messageId),
    [userActionsDeps]
  )

  const retryLastRequest = useCallback(
    () => retryLastRequestAction(userActionsDeps),
    [userActionsDeps]
  )

  const clearError = useCallback(() => setError(null), [setError])

  const forceStopAgent = useCallback(() => {
    stopAgent({ force: true })
  }, [stopAgent])

  const backgroundStreamChatId = getBackgroundStreamChatId(activeChatId)

  return {
    messages,
    stage,
    agentBusy,
    agentPhase,
    backgroundStreamChatId,
    queuedMessages,
    sendUserMessage,
    enqueueUserMessage,
    updateQueuedMessage,
    removeQueuedMessage,
    sendQueuedMessageNow,
    flushQueuedMessages,
    beginVoiceUserMessage,
    updateVoiceUserMessage,
    commitVoiceUserMessage,
    cancelVoiceUserMessage,
    submitEditedUserMessage,
    regenerateAssistantMessage,
    stopAgent,
    forceStopAgent,
    retryLastRequest,
    clearError,
    activeChatId
  }
}
