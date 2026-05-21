import { useCallback, useEffect, useRef } from 'react'
import { useChatsStore } from '@/entities/chat/model/store'
import {
  EMPTY_MESSAGE_QUEUE,
  useMessageQueueStore
} from '@/entities/message-queue/model/store'
import {
  useConversationStore,
  type PipelineStage
} from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { stopTtsPlayback } from '@/features/text-to-speech/model/playTts'
import {
  createStreamingSentenceTts,
  type StreamingSentenceTts
} from '@/features/text-to-speech/model/streamingSentenceTts'
import { messageHasVisibleContent } from '@/shared/lib/chat-message-api'
import { resolveMessagesForApi } from '@/shared/lib/resolve-chat-api-messages'
import { messagesHaveImages } from '@/shared/lib/vision-models'
import { persistAttachments } from '@/entities/message/lib/prepare-attachment'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { EMPTY_MESSAGES } from '@/entities/message/model/types'
import { formatOpenRouterError } from '@/shared/lib/openrouter-errors'
import type { ChatMessagePayload, ChatStreamController } from '@/shared/types/ipc'
import { getLingo } from '@/shared/lib/lingo'
import { beginAgentRun, cancelAgentRun, isAgentRunActive } from './agent-run'

function isAgentPipelineBusy(stage: PipelineStage, streamActive: boolean): boolean {
  return (
    streamActive ||
    stage === 'thinking' ||
    stage === 'searching' ||
    stage === 'speaking'
  )
}

async function getHistoryForApi(chatId: string): Promise<ChatMessagePayload[]> {
  const chat = useChatsStore.getState().chats.find((c) => c.id === chatId)
  const base = await resolveMessagesForApi(
    chat?.messages.filter(messageHasVisibleContent) ?? []
  )

  const { addressUserByName, displayName } = useSettingsStore.getState()
  const name = displayName?.trim()
  if (!addressUserByName || !name) return base

  return [
    {
      role: 'system',
      content: `The user's name is ${name}. Address the user by name when replying.`
    },
    ...base
  ]
}

type UseAiChatOptions = {
  /** Called when an agent speech turn finishes (TTS done) — used to reopen the mic in live mode. */
  onLiveConversationTurnComplete?: () => void
}

export function useAiChat(options: UseAiChatOptions = {}) {
  const activeChat = useChatsStore((s) => s.getActiveChat())
  const addMessage = useChatsStore((s) => s.addMessage)
  const removeMessagesFrom = useChatsStore((s) => s.removeMessagesFrom)
  const removeMessagesAfter = useChatsStore((s) => s.removeMessagesAfter)
  const updateUserMessageContent = useChatsStore((s) => s.updateUserMessageContent)
  const updateMessageContent = useChatsStore((s) => s.updateMessageContent)
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const modelId = useSettingsStore((s) => s.modelId)
  const modelAutoFallback = useSettingsStore((s) => s.modelAutoFallback)
  const chatComposerMode = useSettingsStore((s) => s.chatComposerMode)
  const webSearchEnabled = useSettingsStore((s) => s.webSearchEnabled)
  const stage = useConversationStore((s) => s.stage)
  const setStage = useConversationStore((s) => s.setStage)
  const setConversationError = useConversationStore((s) => s.setError)
  const setChatHasError = useChatsStore((s) => s.setChatHasError)
  const setBlurAnimateMessageId = useConversationStore((s) => s.setBlurAnimateMessageId)

  const setError = useCallback(
    (error: string | null) => {
      setConversationError(error)
      const chatId = useChatsStore.getState().activeChatId
      if (chatId) setChatHasError(chatId, Boolean(error))
    },
    [setConversationError, setChatHasError]
  )
  const streamControllerRef = useRef<ChatStreamController | null>(null)
  const streamingTtsRef = useRef<StreamingSentenceTts | null>(null)
  const runAssistantReplyRef = useRef<(chatId: string) => Promise<void>>(async () => {})

  const messages = activeChat?.messages ?? EMPTY_MESSAGES
  const activeChatId = activeChat?.id ?? null
  const queuedMessages = useMessageQueueStore((s) =>
    activeChatId ? (s.byChatId[activeChatId] ?? EMPTY_MESSAGE_QUEUE) : EMPTY_MESSAGE_QUEUE
  )

  const processNextInQueue = useCallback(
    async (chatId: string) => {
      while (useMessageQueueStore.getState().getQueue(chatId).length > 0) {
        const item = useMessageQueueStore.getState().dequeue(chatId)
        if (!item) break

        const hasText = Boolean(item.content.trim())
        const hasAttachments = (item.attachments?.length ?? 0) > 0
        if (!hasText && !hasAttachments) continue

        addMessage(
          {
            role: 'user',
            content: item.content,
            attachments: hasAttachments ? item.attachments : undefined
          },
          chatId
        )
        await runAssistantReplyRef.current(chatId)
        return
      }
      setStage('idle')
    },
    [addMessage, setStage]
  )

  const stopAgent = useCallback(() => {
    streamControllerRef.current?.abort()
    streamControllerRef.current = null
    streamingTtsRef.current?.cancel()
    streamingTtsRef.current = null
    cancelAgentRun()
    stopTtsPlayback()
    setBlurAnimateMessageId(null)
    setStage('idle')
  }, [setBlurAnimateMessageId, setStage])

  const runAssistantReply = useCallback(
    async (targetChatId: string) => {
      const runId = beginAgentRun()
      const history = await getHistoryForApi(targetChatId)
      const hasImagesInThread = messagesHaveImages(history)

      setStage(webSearchEnabled && !hasImagesInThread ? 'searching' : 'thinking')
      setError(null)

      let assistantMessageId: string | null = null
      let finalText = ''
      const ttsEnabled = useSettingsStore.getState().ttsEnabled
      const playTts = ttsEnabled && chatComposerMode === 'conversation'
      let streamingTts: StreamingSentenceTts | null = null

      if (playTts) {
        streamingTts = createStreamingSentenceTts({
          locale: practiceLanguage,
          runId,
          targetChatId,
          onSpeaking: () => {
            if (!isAgentRunActive(runId)) return
            if (useChatsStore.getState().activeChatId !== targetChatId) return
            setStage('speaking')
          }
        })
        streamingTtsRef.current = streamingTts
      }

      const syncAssistantText = (text: string) => {
        if (!text) return
        if (assistantMessageId) {
          updateMessageContent(assistantMessageId, text, targetChatId)
          return
        }
        const id = addMessage({ role: 'assistant', content: text }, targetChatId)
        assistantMessageId = id || null
      }

      try {
        const stream = getLingo().chat.stream(
          {
            messages: history,
            model: modelId,
            practiceLanguage,
            webSearch: webSearchEnabled && !hasImagesInThread,
            modelAutoFallback
          },
          {
            onSearching: () => {
              if (!isAgentRunActive(runId)) return
              if (useChatsStore.getState().activeChatId === targetChatId) {
                setStage('searching')
              }
            },
            onTextDelta: ({ text }) => {
              if (!isAgentRunActive(runId)) return
              finalText = text
              syncAssistantText(text)
              if (useChatsStore.getState().activeChatId !== targetChatId) return
              if (streamingTts) {
                streamingTts.feed(text)
              } else {
                setStage('idle')
              }
            },
            onDone: ({ text }) => {
              if (!isAgentRunActive(runId)) return
              finalText = text
              syncAssistantText(text)
            }
          }
        )

        streamControllerRef.current = stream
        await stream.done

        if (!isAgentRunActive(runId)) {
          if (assistantMessageId) removeMessagesFrom(assistantMessageId, targetChatId)
          return
        }

        if (!finalText.trim() || !assistantMessageId) {
          if (assistantMessageId) removeMessagesFrom(assistantMessageId, targetChatId)
          throw new Error('Model returned an empty response')
        }

        useChatsStore.getState().notifyChatReplyReady(targetChatId)

        const isViewingTargetChat =
          useChatsStore.getState().activeChatId === targetChatId &&
          !window.location.hash.startsWith('#/settings')

        if (!isViewingTargetChat) {
          streamingTts?.cancel()
          streamingTtsRef.current = null
          return
        }

        setBlurAnimateMessageId(assistantMessageId)

        if (streamingTts) {
          try {
            await streamingTts.finish()
          } catch (playError) {
            if (!isAgentRunActive(runId)) return
            if (useChatsStore.getState().activeChatId !== targetChatId) return
            const playMsg = playError instanceof Error ? playError.message : 'PLAYBACK_FAILED'
            setError(
              playMsg.includes('PLAYBACK_FAILED') || playMsg.includes('TTS_')
                ? 'Could not play audio. The assistant reply is shown in the chat.'
                : playMsg
            )
          } finally {
            streamingTtsRef.current = null
          }
        }

        if (isAgentRunActive(runId) && useChatsStore.getState().activeChatId === targetChatId) {
          const hasQueued = useMessageQueueStore.getState().getQueue(targetChatId).length > 0
          if (hasQueued) {
            await processNextInQueue(targetChatId)
          } else {
            setStage('idle')
            if (playTts) options.onLiveConversationTurnComplete?.()
          }
        }
      } catch (e) {
        if (!isAgentRunActive(runId)) return
        if (useChatsStore.getState().activeChatId !== targetChatId) return

        const msg = e instanceof Error ? e.message : 'Request failed'
        const aborted = msg.includes('aborted') || (e instanceof Error && e.name === 'AbortError')
        if (aborted) {
          streamingTts?.cancel()
          streamingTtsRef.current = null
          if (assistantMessageId) removeMessagesFrom(assistantMessageId, targetChatId)
          setStage('idle')
          return
        }

        if (assistantMessageId) removeMessagesFrom(assistantMessageId, targetChatId)
        setBlurAnimateMessageId(null)
        if (msg.includes('NO_OPENROUTER_KEY')) {
          setError('Add your OpenRouter API key in Settings.')
        } else if (msg.includes('TTS_EMPTY')) {
          setError('Speech synthesis returned no audio. The text reply is still in the chat.')
          setStage('idle')
        } else {
          setError(formatOpenRouterError(msg))
          setStage('idle')
        }
      } finally {
        streamControllerRef.current = null
        if (streamingTtsRef.current === streamingTts) {
          streamingTtsRef.current = null
        }
      }
    },
    [
      addMessage,
      modelId,
      modelAutoFallback,
      practiceLanguage,
      removeMessagesFrom,
      setBlurAnimateMessageId,
      setError,
      setStage,
      chatComposerMode,
      webSearchEnabled,
      updateMessageContent,
      processNextInQueue,
      options.onLiveConversationTurnComplete
    ]
  )

  useEffect(() => {
    runAssistantReplyRef.current = runAssistantReply
  })

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
    async (id: string) => {
      const chatId = useChatsStore.getState().activeChatId
      if (!chatId) return

      const item = useMessageQueueStore.getState().getQueue(chatId).find((m) => m.id === id)
      if (!item) return

      useMessageQueueStore.getState().remove(chatId, id)
      stopAgent()
      useConversationStore.getState().setSpeechError(null)
      addMessage(
        {
          role: 'user',
          content: item.content,
          attachments: item.attachments?.length ? item.attachments : undefined
        },
        chatId
      )
      await runAssistantReply(chatId)
    },
    [addMessage, runAssistantReply, stopAgent]
  )

  const flushQueuedMessages = useCallback(
    async (chatId?: string) => {
      const targetId = chatId ?? useChatsStore.getState().activeChatId
      if (!targetId) return
      if (useMessageQueueStore.getState().getQueue(targetId).length === 0) return
      const { stage: currentStage } = useConversationStore.getState()
      if (isAgentPipelineBusy(currentStage, streamControllerRef.current != null)) return
      await processNextInQueue(targetId)
    },
    [processNextInQueue]
  )

  const sendUserMessage = useCallback(
    async (content: string, attachments?: MessageAttachment[]) => {
      const trimmed = content.trim()
      const hasAttachments = (attachments?.length ?? 0) > 0
      if (!trimmed && !hasAttachments) return

      const chatId = useChatsStore.getState().activeChatId ?? useChatsStore.getState().ensureActiveChat()

      useConversationStore.getState().setSpeechError(null)

      const { stage: currentStage } = useConversationStore.getState()
      const busy = isAgentPipelineBusy(currentStage, streamControllerRef.current != null)

      if (busy) {
        enqueueUserMessage(trimmed, chatId, hasAttachments ? attachments : undefined)
        if (hasAttachments) {
          useChatsStore.getState().clearComposerAttachments(chatId)
        }
        return
      }

      stopAgent()
      addMessage(
        {
          role: 'user',
          content: trimmed,
          attachments: hasAttachments ? attachments : undefined
        },
        chatId
      )
      useChatsStore.getState().clearComposerAttachments(chatId)
      await runAssistantReply(chatId)
    },
    [addMessage, enqueueUserMessage, runAssistantReply, stopAgent]
  )

  const beginVoiceUserMessage = useCallback(() => {
    const chatId = useChatsStore.getState().activeChatId ?? useChatsStore.getState().ensureActiveChat()
    stopAgent()
    useConversationStore.getState().setSpeechError(null)
    const messageId = addMessage({ role: 'user', content: '' }, chatId)
    return { messageId, chatId }
  }, [addMessage, stopAgent])

  const updateVoiceUserMessage = useCallback((messageId: string, content: string) => {
    updateMessageContent(messageId, content, undefined, { allowEmptyUser: true })
  }, [updateMessageContent])

  const cancelVoiceUserMessage = useCallback(
    (messageId: string) => {
      if (!messageId) return
      removeMessagesFrom(messageId)
      setStage('idle')
    },
    [removeMessagesFrom, setStage]
  )

  const commitVoiceUserMessage = useCallback(
    async (messageId: string) => {
      if (!messageId) return

      const chat = useChatsStore.getState().getActiveChat()
      const message = chat?.messages.find((m) => m.id === messageId)
      const trimmed = message?.content.trim() ?? ''

      if (!trimmed) {
        cancelVoiceUserMessage(messageId)
        return
      }

      updateMessageContent(messageId, trimmed)
      if (!chat) return

      const { stage: currentStage } = useConversationStore.getState()
      const busy = isAgentPipelineBusy(currentStage, streamControllerRef.current != null)
      if (busy) {
        enqueueUserMessage(trimmed, chat.id)
        removeMessagesFrom(messageId)
        return
      }

      await runAssistantReply(chat.id)
    },
    [cancelVoiceUserMessage, enqueueUserMessage, removeMessagesFrom, runAssistantReply, updateMessageContent]
  )

  const submitEditedUserMessage = useCallback(
    async (messageId: string, content: string, attachments?: MessageAttachment[]) => {
      const trimmed = content.trim()
      const editAttachments = attachments ?? []

      const chat = useChatsStore.getState().getActiveChat()
      const message = chat?.messages.find((m) => m.id === messageId)
      if (!chat || !message || message.role !== 'user') return
      if (!trimmed && editAttachments.length === 0) return

      const chatId = chat.id

      stopAgent()
      const preparedAttachments =
        editAttachments.length > 0 ? await persistAttachments(editAttachments) : editAttachments
      updateUserMessageContent(messageId, trimmed, preparedAttachments)
      removeMessagesAfter(messageId, chatId)
      setBlurAnimateMessageId(null)
      setError(null)
      await runAssistantReply(chatId)
    },
    [
      runAssistantReply,
      removeMessagesAfter,
      setBlurAnimateMessageId,
      setError,
      stopAgent,
      updateUserMessageContent
    ]
  )

  const regenerateAssistantMessage = useCallback(
    async (messageId: string) => {
      const chat = useChatsStore.getState().getActiveChat()
      const message = chat?.messages.find((m) => m.id === messageId)
      if (!chat || !message || message.role !== 'assistant') return

      const chatId = chat.id

      stopAgent()
      removeMessagesFrom(messageId)
      setBlurAnimateMessageId(null)
      await runAssistantReply(chatId)
    },
    [removeMessagesFrom, runAssistantReply, setBlurAnimateMessageId, stopAgent]
  )

  const retryLastRequest = useCallback(async () => {
    const chat = useChatsStore.getState().getActiveChat()
    if (!chat || chat.messages.length === 0) return

    setError(null)
    const last = chat.messages[chat.messages.length - 1]

    if (last.role === 'user') {
      await runAssistantReply(chat.id)
      return
    }

    if (last.role === 'assistant') {
      await regenerateAssistantMessage(last.id)
    }
  }, [regenerateAssistantMessage, runAssistantReply, setError])

  const clearError = useCallback(() => setError(null), [setError])

  return {
    messages,
    stage,
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
    retryLastRequest,
    clearError,
    activeChatId
  }
}
