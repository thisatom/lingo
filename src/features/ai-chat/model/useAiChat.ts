import { useCallback, useEffect, useRef, useState } from 'react'
import { useChatsStore } from '@/entities/chat/model/store'
import {
  EMPTY_MESSAGE_QUEUE,
  useMessageQueueStore
} from '@/entities/message-queue/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { stopTtsPlayback } from '@/features/text-to-speech/model/playTts'
import {
  createStreamingSentenceTts,
  type StreamingSentenceTts
} from '@/features/text-to-speech/model/streamingSentenceTts'
import { messagesHaveImages } from '@/shared/lib/vision-models'
import { getHistoryForApi } from '@/features/ai-chat/lib/chat-api-history'
import { createStreamContentSync } from '@/features/ai-chat/lib/stream-content-sync'
import { shouldRunWebSearch } from '@/shared/lib/web-search-intent'
import { persistAttachments } from '@/entities/message/lib/prepare-attachment'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { EMPTY_MESSAGES } from '@/entities/message/model/types'
import { formatLlmError } from '@/shared/lib/llm-errors'
import { customEndpointRequiresApiKey } from '@/shared/lib/custom-llm-errors'
import { parseCustomLlmProfileSource } from '@/shared/lib/custom-llm-profile'
import {
  buildChatStreamLlmFields,
  validateCustomLlmSettings
} from '@/shared/lib/resolve-chat-stream-llm'
import type { ChatStreamController } from '@/shared/types/ipc'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import { formatQueuePreview } from '@/entities/message-queue/lib/format-queue-preview'
import {
  agentTurnTailMessageId,
  findTurnTailRemoveId,
  removeAgentTurnTail,
  removeAgentTurnTailUnlessPersisted
} from '@/features/ai-chat/lib/agent-turn-cleanup'
import { isPlaybackOnlyConversationError } from '@/features/ai-chat/lib/post-reply'
import '@/features/ai-chat/lib/chat-pipeline-registry'
import {
  getBackgroundStreamChatId,
  getAgentStreamChatId,
  setAgentStreamSession
} from '@/features/ai-chat/lib/agent-stream-session'
import {
  consumePendingAgentReply,
  hasPendingAgentReply,
  markPendingAgentReply
} from '@/features/ai-chat/lib/pending-agent-reply'
import {
  getOtherChatStreamBlocking,
  OTHER_CHAT_STREAM_MESSAGE,
  shouldDeferChatAgentTurn
} from '@/features/ai-chat/lib/agent-stream-guard'
import {
  clearPipelineDetailForChat,
  isViewingChat,
  setPipelineErrorForChat,
  setPipelineSearchTargetsForChat,
  setActiveChatPipelineStage,
  setPipelineStageForChat,
  setPipelineStreamingAnswerForChat
} from '@/features/ai-chat/lib/pipeline-stage'
import {
  isAgentPipelineBusy,
  isChatAgentBusy
} from '@/features/ai-chat/lib/chat-agent-busy'
import { beginAgentRun, cancelAgentRun, isAgentRunActive } from './agent-run'
import {
  restoreUserMessageEdit,
  snapshotUserMessageEdit,
  type SubmitEditedUserMessageResult
} from './submit-edited-user-message'

export type { SubmitEditedUserMessageResult } from './submit-edited-user-message'

export type StopAgentOptions = {
  /** Only cancel when the in-flight stream targets this chat. */
  chatId?: string | null
  /** Cancel any in-flight stream regardless of chat (Stop button, mode switch). */
  force?: boolean
}

/** Prevents live mode / UI staying busy if TTS playback never resolves. */
const STREAMING_TTS_FINISH_MS = 120_000

async function waitStreamingTtsFinish(tts: StreamingSentenceTts): Promise<void> {
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    tts.cancel()
  }, STREAMING_TTS_FINISH_MS)
  try {
    await tts.finish()
  } finally {
    clearTimeout(timer)
    if (timedOut) tts.cancel()
  }
}

function playbackErrorMessage(playError: unknown): string {
  const playMsg = playError instanceof Error ? playError.message : 'PLAYBACK_FAILED'
  if (playMsg.includes('TTS_EMPTY')) {
    return 'Speech synthesis returned no audio. The text reply is still in the chat.'
  }
  return playMsg.includes('PLAYBACK_FAILED') || playMsg.includes('TTS_')
    ? 'Could not play audio. The assistant reply is shown in the chat.'
    : playMsg
}

async function finishStreamingTtsPlayback(
  tts: StreamingSentenceTts,
  finalText: string,
  onPlaybackError: (message: string) => void
): Promise<void> {
  if (finalText.trim()) {
    tts.feed(finalText)
  }
  try {
    await waitStreamingTtsFinish(tts)
  } catch (playError) {
    onPlaybackError(playbackErrorMessage(playError))
  }
}

function finishAgentTurnForChat(
  targetChatId: string,
  agentSpeechMode: boolean,
  onLiveConversationTurnComplete?: () => void
): void {
  setPipelineStageForChat(targetChatId, 'idle')
  if (agentSpeechMode && isViewingChat(targetChatId)) {
    onLiveConversationTurnComplete?.()
  }
}

type UseAiChatOptions = {
  /** Agent Speech: reopen mic after the assistant turn (with or without TTS). */
  onLiveConversationTurnComplete?: () => void
}

export function useAiChat(options: UseAiChatOptions = {}) {
  const activeChat = useChatsStore((s) => s.getActiveChat())
  const addMessage = useChatsStore((s) => s.addMessage)
  const removeMessagesFrom = useChatsStore((s) => s.removeMessagesFrom)
  const removeMessage = useChatsStore((s) => s.removeMessage)
  const removeMessagesAfter = useChatsStore((s) => s.removeMessagesAfter)
  const updateUserMessageContent = useChatsStore((s) => s.updateUserMessageContent)
  const updateMessageContent = useChatsStore((s) => s.updateMessageContent)
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const chatComposerMode = useSettingsStore((s) => s.chatComposerMode)
  const stage = useConversationStore((s) => s.stage)
  const setStage = useConversationStore((s) => s.setStage)
  const setBlurAnimateMessageId = useConversationStore((s) => s.setBlurAnimateMessageId)

  const setError = useCallback(
    (error: string | null, targetChatId?: string) => {
      const chatId = targetChatId ?? useChatsStore.getState().activeChatId
      if (!chatId) return
      setPipelineErrorForChat(chatId, error)
    },
    []
  )
  const streamControllerRef = useRef<ChatStreamController | null>(null)
  const streamTargetChatIdRef = useRef<string | null>(null)
  const [streamActive, setStreamActive] = useState(false)
  const streamingTtsRef = useRef<StreamingSentenceTts | null>(null)
  const runAssistantReplyRef = useRef<(chatId: string) => Promise<boolean>>(
    async () => false
  )

  const tryRunPendingAgentReply = useCallback(async (chatId: string): Promise<boolean> => {
    if (!hasPendingAgentReply(chatId)) return false
    if (shouldDeferChatAgentTurn(chatId)) return false
    consumePendingAgentReply(chatId)
    return runAssistantReplyRef.current(chatId)
  }, [])

  const messages = activeChat?.messages ?? EMPTY_MESSAGES
  const activeChatId = activeChat?.id ?? null
  const queuedMessages = useMessageQueueStore((s) =>
    activeChatId ? (s.byChatId[activeChatId] ?? EMPTY_MESSAGE_QUEUE) : EMPTY_MESSAGE_QUEUE
  )

  const processNextInQueue = useCallback(
    async (chatId: string) => {
      useConversationStore.getState().setQueueAheadPreview(null)

      while (useMessageQueueStore.getState().getQueue(chatId).length > 0) {
        if (getOtherChatStreamBlocking(chatId)) {
          setPipelineStageForChat(chatId, 'idle')
          return
        }

        const item = useMessageQueueStore.getState().getQueue(chatId)[0]
        if (!item) break

        const hasText = Boolean(item.content.trim())
        const hasAttachments = (item.attachments?.length ?? 0) > 0
        if (!hasText && !hasAttachments) {
          useMessageQueueStore.getState().remove(chatId, item.id)
          continue
        }

        const userMessageId = addMessage(
          {
            role: 'user',
            content: item.content,
            attachments: hasAttachments ? item.attachments : undefined
          },
          chatId
        )
        const ok = await runAssistantReplyRef.current(chatId)
        if (ok) {
          useMessageQueueStore.getState().remove(chatId, item.id)
          return
        }

        if (userMessageId) removeMessagesFrom(userMessageId, chatId)
        useMessageQueueStore.getState().remove(chatId, item.id)
        setPipelineStageForChat(chatId, 'idle')
        return
      }

      if (await tryRunPendingAgentReply(chatId)) {
        return
      }

      setPipelineStageForChat(chatId, 'idle')
    },
    [addMessage, removeMessagesFrom, tryRunPendingAgentReply]
  )

  const stopAgent = useCallback((options: StopAgentOptions = {}) => {
    const { force = false, chatId: scopeChatId = null } = options
    const streamChatId =
      streamTargetChatIdRef.current ?? getAgentStreamChatId()

    if (!force && streamChatId && scopeChatId && streamChatId !== scopeChatId) {
      return
    }

    streamControllerRef.current?.abort()
    streamControllerRef.current = null
    setStreamActive(false)
    streamingTtsRef.current?.cancel()
    streamingTtsRef.current = null
    cancelAgentRun()
    stopTtsPlayback()
    setBlurAnimateMessageId(null)
    useConversationStore.getState().setQueueAheadPreview(null)
    streamTargetChatIdRef.current = null
    const chatId =
      streamChatId ?? scopeChatId ?? useChatsStore.getState().activeChatId ?? null
    if (chatId) {
      setPipelineStageForChat(chatId, 'idle')
    } else {
      setStage('idle')
      useConversationStore.getState().clearPipelineDetail()
    }
  }, [setBlurAnimateMessageId, setStage])

  const runAssistantReply = useCallback(
    async (targetChatId: string): Promise<boolean> => {
      if (getOtherChatStreamBlocking(targetChatId)) {
        return false
      }

      const runId = beginAgentRun()
      const llmSettings = useSettingsStore.getState()

      const customError = validateCustomLlmSettings(llmSettings)
      if (customError) {
        setError(customError, targetChatId)
        setPipelineStageForChat(targetChatId, 'idle')
        return false
      }

      if (llmSettings.llmBackend === 'custom') {
        const parsed = parseCustomLlmProfileSource(llmSettings.customLlmProfileJson)
        if (parsed.ok && customEndpointRequiresApiKey(parsed.data.baseUrl)) {
          if (!isLingoAvailable()) {
            setError('Custom cloud endpoints require the desktop app (npm run dev).', targetChatId)
            setPipelineStageForChat(targetChatId, 'idle')
            return false
          }
          const keyStatus = await getLingo().secrets.getStatus('custom-llm')
          if (!keyStatus.isSet) {
            setError(
              'Add your NVIDIA API key under Settings → API → Custom endpoint API key (nvapi-…).',
              targetChatId
            )
            setPipelineStageForChat(targetChatId, 'idle')
            return false
          }
        }
      }

      clearPipelineDetailForChat(targetChatId)
      setPipelineStreamingAnswerForChat(targetChatId, false)
      setPipelineStageForChat(targetChatId, 'thinking')
      setError(null, targetChatId)

      const activeModelId =
        llmSettings.llmBackend === 'custom' ? llmSettings.customModelId : llmSettings.modelId
      const history = await getHistoryForApi(targetChatId, {
        modelId: activeModelId,
        maxTokens: llmSettings.llmMaxTokens
      })
      const hasImagesInThread = messagesHaveImages(history)
      const lastUserText =
        [...(useChatsStore.getState().chats.find((c) => c.id === targetChatId)?.messages ?? [])]
          .reverse()
          .find((m) => m.role === 'user')
          ?.content.trim() ?? ''
      const webSearchForTurn =
        llmSettings.webSearchEnabled &&
        llmSettings.llmBackend === 'openrouter' &&
        !hasImagesInThread &&
        shouldRunWebSearch(lastUserText)

      if (webSearchForTurn) {
        setPipelineStageForChat(targetChatId, 'searching')
      } else {
        setPipelineStageForChat(targetChatId, 'thinking')
      }

      let assistantMessageId: string | null = null
      let thinkingMessageId: string | null = null

      const ensureThinkingPlaceholder = () => {
        if (thinkingMessageId) return
        const id = addMessage({ role: 'thinking', content: '' }, targetChatId)
        thinkingMessageId = id || null
      }

      let finalThinkingText = ''
      let finalText = ''
      const ttsEnabled = llmSettings.ttsEnabled
      const playTts = ttsEnabled
      let streamingTts: StreamingSentenceTts | null = null
      let ttsAnswerFeedEnabled = false

      const ensureStreamingTts = (): StreamingSentenceTts | null => {
        if (!playTts || streamingTts) return streamingTts
        streamingTts = createStreamingSentenceTts({
          locale: practiceLanguage,
          runId,
          targetChatId,
          onSpeaking: () => {
            if (!isAgentRunActive(runId)) return
            setPipelineStageForChat(targetChatId, 'speaking')
          }
        })
        streamingTtsRef.current = streamingTts
        return streamingTts
      }

      const feedStreamingTts = (text: string) => {
        if (!playTts || !text.trim() || !isViewingChat(targetChatId)) return
        if (!ttsAnswerFeedEnabled) {
          ttsAnswerFeedEnabled = true
        }
        ensureStreamingTts()?.feed(text)
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

      const syncThinkingToChat = (text: string) => {
        if (thinkingMessageId) {
          updateMessageContent(thinkingMessageId, text, targetChatId)
          return
        }
        if (!text.trim()) return
        const id = addMessage({ role: 'thinking', content: text }, targetChatId)
        thinkingMessageId = id || null
      }

      const thinkingSync = createStreamContentSync(syncThinkingToChat)
      const streamSync = createStreamContentSync(syncAssistantText)

      if (!webSearchForTurn) {
        ensureThinkingPlaceholder()
      }

      try {
        const stream = getLingo().chat.stream(
          {
            messages: history,
            practiceLanguage,
            ...buildChatStreamLlmFields(llmSettings),
            webSearch: webSearchForTurn
          },
          {
            onSearching: () => {
              if (!isAgentRunActive(runId)) return
              setPipelineStageForChat(targetChatId, 'searching')
            },
            onSearchTargets: ({ targets }) => {
              if (!isAgentRunActive(runId)) return
              setPipelineSearchTargetsForChat(targetChatId, targets)
            },
            onThinkingDelta: ({ text }) => {
              if (!isAgentRunActive(runId)) return
              finalThinkingText = text
              setPipelineStageForChat(targetChatId, 'thinking')
              ensureThinkingPlaceholder()
              thinkingSync.push(text)
            },
            onTextDelta: ({ text }) => {
              if (!isAgentRunActive(runId)) return
              finalText = text
              if (text.trim() && !finalThinkingText.trim() && thinkingMessageId) {
                removeMessage(thinkingMessageId, targetChatId)
                thinkingMessageId = null
              }
              if (text.trim()) {
                setPipelineStreamingAnswerForChat(targetChatId, true)
                clearPipelineDetailForChat(targetChatId)
              }
              streamSync.push(text)
              feedStreamingTts(text)
            },
            onDone: ({ text }) => {
              if (!isAgentRunActive(runId)) return
              finalText = text.trim()
              thinkingSync.flushNow(finalThinkingText)
              if (text.trim()) {
                streamSync.flushNow(text)
                feedStreamingTts(text)
              }
            }
          }
        )

        streamControllerRef.current = stream
        streamTargetChatIdRef.current = targetChatId
        setStreamActive(true)
        setAgentStreamSession(targetChatId, true)
        await stream.done

        if (!isAgentRunActive(runId)) {
          removeAgentTurnTailUnlessPersisted(
            removeMessagesFrom,
            targetChatId,
            thinkingMessageId,
            assistantMessageId,
            finalText
          )
          setPipelineStageForChat(targetChatId, 'idle')
          return false
        }

        if (!finalText.trim() && assistantMessageId) {
          const chat = useChatsStore.getState().chats.find((c) => c.id === targetChatId)
          const message = chat?.messages.find((m) => m.id === assistantMessageId)
          finalText = message?.content.trim() ?? ''
        }

        if (thinkingMessageId && !finalThinkingText.trim()) {
          removeMessage(thinkingMessageId, targetChatId)
          thinkingMessageId = null
        }

        if (!finalText.trim() || !assistantMessageId) {
          if (assistantMessageId) {
            removeMessage(assistantMessageId, targetChatId)
          }
          if (finalThinkingText.trim() && thinkingMessageId) {
            setError('Model returned reasoning but no answer.', targetChatId)
            setPipelineStageForChat(targetChatId, 'idle')
            return false
          }
          const removeId = agentTurnTailMessageId(thinkingMessageId, assistantMessageId)
          if (removeId) removeMessagesFrom(removeId, targetChatId)
          throw new Error('Model returned an empty response')
        }

        useChatsStore.getState().notifyChatReplyReady(targetChatId)

        const hasQueued = useMessageQueueStore.getState().getQueue(targetChatId).length > 0

        const isViewingTargetChat = isViewingChat(targetChatId)

        if (!isViewingTargetChat) {
          streamingTts?.cancel()
          streamingTtsRef.current = null
          if (isAgentRunActive(runId)) {
            if (hasQueued) {
              await processNextInQueue(targetChatId)
            } else {
              finishAgentTurnForChat(
                targetChatId,
                chatComposerMode === 'conversation',
                options.onLiveConversationTurnComplete
              )
              await tryRunPendingAgentReply(targetChatId)
            }
          }
          return true
        }

        setBlurAnimateMessageId(assistantMessageId)

        if (hasQueued) {
          if (playTts && streamingTts?.isActive) {
            const nextQueued = useMessageQueueStore.getState().getQueue(targetChatId)[0]
            const preview = formatQueuePreview(nextQueued)
            if (preview) useConversationStore.getState().setQueueAheadPreview(preview)
          }
          if (playTts && streamingTts) {
            await finishStreamingTtsPlayback(streamingTts, finalText, (message) => {
              if (isAgentRunActive(runId)) {
                setError(message, targetChatId)
              }
            })
            streamingTtsRef.current = null
          } else {
            streamingTts?.cancel()
            streamingTtsRef.current = null
          }
        } else if (streamingTts) {
          await finishStreamingTtsPlayback(streamingTts, finalText, (message) => {
            if (isAgentRunActive(runId)) {
              setError(message, targetChatId)
            }
          })
          streamingTtsRef.current = null
        }

        if (isAgentRunActive(runId)) {
          if (hasQueued) {
            await processNextInQueue(targetChatId)
          } else {
            finishAgentTurnForChat(
              targetChatId,
              chatComposerMode === 'conversation',
              options.onLiveConversationTurnComplete
            )
            await tryRunPendingAgentReply(targetChatId)
          }
        }
        return true
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Request failed'
        const aborted = msg.includes('aborted') || (e instanceof Error && e.name === 'AbortError')

        if (!isAgentRunActive(runId)) {
          if (aborted) {
            removeAgentTurnTail(
              removeMessagesFrom,
              targetChatId,
              thinkingMessageId,
              assistantMessageId
            )
          } else {
            removeAgentTurnTailUnlessPersisted(
              removeMessagesFrom,
              targetChatId,
              thinkingMessageId,
              assistantMessageId,
              finalText
            )
          }
          setPipelineStageForChat(targetChatId, 'idle')
          return false
        }

        if (aborted) {
          streamingTts?.cancel()
          streamingTtsRef.current = null
          removeAgentTurnTail(
            removeMessagesFrom,
            targetChatId,
            thinkingMessageId,
            assistantMessageId
          )
          setPipelineStageForChat(targetChatId, 'idle')
          return false
        }

        removeAgentTurnTail(
          removeMessagesFrom,
          targetChatId,
          thinkingMessageId,
          assistantMessageId
        )
        if (isViewingChat(targetChatId)) setBlurAnimateMessageId(null)
        if (msg.includes('NO_OPENROUTER_KEY')) {
          setError('Add your OpenRouter API key in Settings.', targetChatId)
        } else if (msg.includes('TTS_EMPTY')) {
          setError(
            'Speech synthesis returned no audio. The text reply is still in the chat.',
            targetChatId
          )
          setPipelineStageForChat(targetChatId, 'idle')
          if (chatComposerMode === 'conversation' && isViewingChat(targetChatId)) {
            options.onLiveConversationTurnComplete?.()
          }
        } else {
          setError(formatLlmError(msg), targetChatId)
          setPipelineStageForChat(targetChatId, 'idle')
        }
        return false
      } finally {
        thinkingSync.cancel()
        streamSync.cancel()
        streamControllerRef.current = null
        if (streamTargetChatIdRef.current === targetChatId) {
          streamTargetChatIdRef.current = null
        }
        setStreamActive(false)
        setAgentStreamSession(null, false)
        if (streamingTtsRef.current === streamingTts) {
          streamingTtsRef.current = null
        }
      }
    },
    [
      addMessage,
      practiceLanguage,
      removeMessagesFrom,
      removeMessage,
      setBlurAnimateMessageId,
      setError,
      setStage,
      chatComposerMode,
      updateMessageContent,
      processNextInQueue,
      options.onLiveConversationTurnComplete,
      tryRunPendingAgentReply
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
      stopAgent({ force: true })
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
      if (shouldDeferChatAgentTurn(targetId)) return
      if (await tryRunPendingAgentReply(targetId)) return
      if (useMessageQueueStore.getState().getQueue(targetId).length === 0) return
      await processNextInQueue(targetId)
    },
    [processNextInQueue, tryRunPendingAgentReply]
  )

  const sendUserMessage = useCallback(
    async (content: string, attachments?: MessageAttachment[]) => {
      const trimmed = content.trim()
      const hasAttachments = (attachments?.length ?? 0) > 0
      if (!trimmed && !hasAttachments) return

      const chatId = useChatsStore.getState().activeChatId ?? useChatsStore.getState().ensureActiveChat()

      useConversationStore.getState().setSpeechError(null)

      if (shouldDeferChatAgentTurn(chatId)) {
        enqueueUserMessage(trimmed, chatId, hasAttachments ? attachments : undefined)
        if (hasAttachments) {
          useChatsStore.getState().clearComposerAttachments(chatId)
        }
        return
      }

      stopAgent({ chatId })
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
    if (getOtherChatStreamBlocking(chatId)) {
      useConversationStore.getState().setSpeechError(OTHER_CHAT_STREAM_MESSAGE)
      return { messageId: null as string | null, chatId }
    }
    stopAgent({ chatId })
    useConversationStore.getState().setSpeechError(null)
    const messageId = addMessage({ role: 'user', content: '' }, chatId)
    return { messageId: messageId || null, chatId }
  }, [addMessage, stopAgent])

  const updateVoiceUserMessage = useCallback((messageId: string, content: string) => {
    updateMessageContent(messageId, content, undefined, { allowEmptyUser: true })
  }, [updateMessageContent])

  const cancelVoiceUserMessage = useCallback(
    (messageId: string) => {
      if (!messageId) return
      removeMessagesFrom(messageId)
      setActiveChatPipelineStage('idle')
    },
    [removeMessagesFrom]
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

      if (shouldDeferChatAgentTurn(chat.id)) {
        markPendingAgentReply(chat.id)
        return
      }

      await runAssistantReply(chat.id)
    },
    [cancelVoiceUserMessage, runAssistantReply, updateMessageContent]
  )

  const submitEditedUserMessage = useCallback(
    async (
      messageId: string,
      content: string,
      attachments?: MessageAttachment[]
    ): Promise<SubmitEditedUserMessageResult> => {
      const trimmed = content.trim()
      const editAttachments = attachments ?? []

      const chat = useChatsStore.getState().getActiveChat()
      const message = chat?.messages.find((m) => m.id === messageId)
      if (!chat || !message || message.role !== 'user') return
      if (!trimmed && editAttachments.length === 0) return

      const chatId = chat.id
      const snapshot = snapshotUserMessageEdit(chat.messages, messageId)
      if (!snapshot) return

      if (getOtherChatStreamBlocking(chatId)) {
        setError(OTHER_CHAT_STREAM_MESSAGE, chatId)
        return
      }

      const rollbackEdit = (): SubmitEditedUserMessageResult => {
        const current = useChatsStore.getState().chats.find((c) => c.id === chatId)
        if (current) {
          useChatsStore
            .getState()
            .setChatMessages(chatId, restoreUserMessageEdit(current.messages, snapshot))
        }
        return { rollbackToEdit: messageId }
      }

      stopAgent({ chatId })
      updateUserMessageContent(
        messageId,
        trimmed,
        editAttachments.length > 0 ? editAttachments : undefined
      )
      removeMessagesAfter(messageId, chatId)
      setBlurAnimateMessageId(null)
      setError(null, chatId)

      try {
        if (editAttachments.length > 0) {
          const preparedAttachments = await persistAttachments(editAttachments)
          updateUserMessageContent(messageId, trimmed, preparedAttachments)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Request failed'
        setError(formatLlmError(msg), chatId)
        setPipelineStageForChat(chatId, 'idle')
        return rollbackEdit()
      }

      await runAssistantReply(chatId)
      const err = useConversationStore.getState().error
      if (err && !isPlaybackOnlyConversationError(err)) {
        return rollbackEdit()
      }
    },
    [
      runAssistantReply,
      removeMessagesAfter,
      setBlurAnimateMessageId,
      setError,
      setStage,
      stopAgent,
      updateUserMessageContent
    ]
  )

  const regenerateAssistantMessage = useCallback(
    async (messageId: string) => {
      const chat = useChatsStore.getState().getActiveChat()
      const message = chat?.messages.find((m) => m.id === messageId)
      if (
        !chat ||
        !message ||
        (message.role !== 'assistant' && message.role !== 'thinking')
      ) {
        return
      }

      const chatId = chat.id
      if (getOtherChatStreamBlocking(chatId)) {
        setError(OTHER_CHAT_STREAM_MESSAGE, chatId)
        return
      }

      const removeFromId = findTurnTailRemoveId(chat.messages, messageId) ?? messageId

      stopAgent({ chatId })
      removeMessagesFrom(removeFromId)
      setBlurAnimateMessageId(null)
      await runAssistantReply(chatId)
    },
    [removeMessagesFrom, runAssistantReply, setBlurAnimateMessageId, stopAgent]
  )

  const retryLastRequest = useCallback(async () => {
    const chat = useChatsStore.getState().getActiveChat()
    if (!chat || chat.messages.length === 0) return

    const chatId = chat.id
    if (getOtherChatStreamBlocking(chatId)) {
      setError(OTHER_CHAT_STREAM_MESSAGE, chatId)
      return
    }

    setError(null)
    stopAgent({ chatId, force: true })
    const last = chat.messages[chat.messages.length - 1]

    if (last.role === 'user') {
      await runAssistantReply(chatId)
      return
    }

    if (last.role === 'assistant' || last.role === 'thinking') {
      await regenerateAssistantMessage(last.id)
    }
  }, [regenerateAssistantMessage, runAssistantReply, setError, stopAgent])

  const clearError = useCallback(() => setError(null), [setError])

  const agentBusy =
    activeChatId != null
      ? isChatAgentBusy(activeChatId)
      : isAgentPipelineBusy(stage, streamActive)
  const backgroundStreamChatId = getBackgroundStreamChatId(activeChatId)

  return {
    messages,
    stage,
    agentBusy,
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
    retryLastRequest,
    clearError,
    activeChatId
  }
}
