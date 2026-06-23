import { useChatsStore } from '@/entities/chat/model/store'
import { useMessageQueueStore } from '@/entities/message-queue/model/store'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { shouldPlayAgentTts } from '@/features/ai-chat/lib/chat-agent-policies'
import {
  applyDoneToTurn,
  applyTextDeltaToTurn
} from '@/features/ai-chat/lib/chat-agent-stream-turn'
import {
  finishAgentTurnForChat,
  finishStreamingTtsPlayback
} from '@/features/ai-chat/lib/chat-agent-turn-helpers'
import { getHistoryForApi } from '@/features/ai-chat/lib/chat-api-history'
import { createStreamContentSync } from '@/features/ai-chat/lib/stream-content-sync'
import {
  agentTurnTailMessageId,
  hasPersistedAssistantTurn,
  removeAgentTurnTail,
  removeAgentTurnTailUnlessPersisted
} from '@/features/ai-chat/lib/agent-turn-cleanup'
import {
  endAgentTurnStreamBinding,
  setAgentStreamSession
} from '@/features/ai-chat/lib/agent-stream-session'
import { getOtherChatStreamBlocking } from '@/features/ai-chat/lib/agent-stream-guard'
import {
  clearPipelineDetailForChat,
  isViewingChat,
  setPipelineErrorForChat,
  setPipelineSearchActiveUrlForChat,
  setPipelineSearchTargetsForChat,
  setPipelineStageForChat,
  setPipelineStreamingAnswerForChat
} from '@/features/ai-chat/lib/pipeline-stage'
import { reconcileTurnMessagesFromStore } from '@/features/ai-chat/lib/reconcile-turn-messages'
import { finalizeAgentTurnPipeline } from '@/features/ai-chat/lib/release-stale-agent-pipeline'
import {
  beginAgentRun as defaultBeginAgentRun,
  isAgentRunActive as defaultIsAgentRunActive
} from '@/features/ai-chat/model/agent-run'
import {
  createStreamingSentenceTts,
  type StreamingSentenceTts
} from '@/features/text-to-speech/model/streamingSentenceTts'
import { formatLlmError } from '@/shared/lib/llm-errors'
import { customEndpointRequiresApiKey } from '@/shared/lib/custom-llm-errors'
import { parseCustomLlmProfileSource } from '@/shared/lib/custom-llm-profile'
import {
  buildChatStreamLlmFields,
  validateCustomLlmSettings
} from '@/shared/lib/resolve-chat-stream-llm'
import {
  resolveWebSearchForChatTurn
} from '@/shared/lib/web-search-turn'
import { SEARCH_FALLBACK_NOTICE } from '@/shared/lib/local-web-search-errors'
import {
  isBrowsableSearchTarget,
  type WebSearchSource
} from '@/shared/lib/web-search-targets'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import { getLastUserMessageContent } from '@/shared/lib/web-search-intent'
import {
  resolvePracticeLanguage
} from '@/shared/config/practice-languages'
import { useConversationStore } from '@/entities/conversation/model/store'
import type { ChatStreamController } from '@/shared/types/ipc'

export type AgentTurnSession = {
  getStreamController: () => ChatStreamController | null
  setStreamController: (controller: ChatStreamController | null) => void
  getStreamTargetChatId: () => string | null
  setStreamTargetChatId: (chatId: string | null) => void
  getStreamingTts: () => StreamingSentenceTts | null
  setStreamingTts: (tts: StreamingSentenceTts | null) => void
  setStreamActive: (active: boolean) => void
}

export type AgentRunApi = {
  beginAgentRun: () => number
  isAgentRunActive: (runId: number) => boolean
}

export type RunAgentTurnParams = {
  targetChatId: string
  session: AgentTurnSession
  practiceLanguage: string
  chatComposerMode: ChatComposerMode
  onLiveConversationTurnComplete?: () => void
  setBlurAnimateMessageId: (id: string | null) => void
  setError: (error: string | null, targetChatId?: string) => void
  processNextInQueue: (chatId: string) => Promise<void>
  tryRunPendingAgentReply: (chatId: string) => Promise<boolean>
  /** Vitest: inject run token so stream handlers stay active under mocked IPC. */
  agentRun?: AgentRunApi
}

export async function runAgentTurn(params: RunAgentTurnParams): Promise<boolean> {
  const {
    targetChatId,
    session,
    practiceLanguage,
    chatComposerMode,
    onLiveConversationTurnComplete,
    setBlurAnimateMessageId,
    setError,
    processNextInQueue,
    tryRunPendingAgentReply,
    agentRun: agentRunOverride
  } = params

  const agentRun: AgentRunApi = agentRunOverride ?? {
    beginAgentRun: defaultBeginAgentRun,
    isAgentRunActive: defaultIsAgentRunActive
  }
  const isAgentRunActive = agentRun.isAgentRunActive

  if (getOtherChatStreamBlocking(targetChatId)) {
    return false
  }

  const runId = agentRun.beginAgentRun()
  const llmSettings = useSettingsStore.getState()
  const storedPracticeLanguage = llmSettings.practiceLanguage
  const addMessage = useChatsStore.getState().addMessage
  const removeMessagesFrom = useChatsStore.getState().removeMessagesFrom
  const removeMessage = useChatsStore.getState().removeMessage
  const updateMessageContent = useChatsStore.getState().updateMessageContent
  const updateMessageSearchSources = useChatsStore.getState().updateMessageSearchSources

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
  const chatMessages =
    useChatsStore.getState().chats.find((c) => c.id === targetChatId)?.messages ?? []
  const webSearchForTurn = resolveWebSearchForChatTurn(llmSettings, chatMessages)
  const lastUserMessageText = getLastUserMessageContent(history)

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
  let hasThinkingStream = false
  let finalText = ''
  let streamCompleted = false
  const agentSpeechMode = chatComposerMode === 'conversation'
  const playTts = shouldPlayAgentTts(llmSettings.ttsEnabled, chatComposerMode)
  let answerTts: StreamingSentenceTts | null = null

  const ensureAnswerTts = (): StreamingSentenceTts | null => {
    if (!playTts || !isViewingChat(targetChatId)) return null
    if (!answerTts) {
      const locale = resolvePracticeLanguage(storedPracticeLanguage, {
        userText: lastUserMessageText,
        assistantText: finalText
      })
      answerTts = createStreamingSentenceTts({
        locale,
        runId,
        targetChatId,
        onSpeaking: () => setPipelineStageForChat(targetChatId, 'speaking')
      })
      session.setStreamingTts(answerTts)
    }
    return answerTts
  }

  const feedAnswerTts = (text: string): void => {
    if (!text.trim()) return
    ensureAnswerTts()?.feed(text)
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
  let turnSearchSources: WebSearchSource[] = []
  let discardPendingSync = false

  const persistTurnSearchSources = () => {
    if (!assistantMessageId || turnSearchSources.length === 0) return
    updateMessageSearchSources(assistantMessageId, turnSearchSources, targetChatId)
    turnSearchSources = []
  }

  try {
    const stream = getLingo().chat.stream(
      {
        messages: history,
        practiceLanguage: storedPracticeLanguage,
        ...buildChatStreamLlmFields(llmSettings),
        webSearch: webSearchForTurn,
        languagePractice: llmSettings.languagePracticeEnabled
      },
      {
        onSearching: () => {
          if (!isAgentRunActive(runId)) return
          setPipelineStageForChat(targetChatId, 'searching')
        },
        onSearchFallback: ({ message }) => {
          if (!isAgentRunActive(runId)) return
          setPipelineSearchActiveUrlForChat(targetChatId, null)
          setPipelineStageForChat(targetChatId, 'thinking')
          setPipelineErrorForChat(targetChatId, message)
        },
        onSearchTargets: ({ targets }) => {
          if (!isAgentRunActive(runId)) return
          const browsable = targets.filter(isBrowsableSearchTarget)
          turnSearchSources = browsable
          setPipelineSearchTargetsForChat(targetChatId, browsable)
          if (browsable.length === 0) return
          if (!assistantMessageId) {
            const id = addMessage({ role: 'assistant', content: '' }, targetChatId)
            assistantMessageId = id || null
          }
          if (assistantMessageId) {
            updateMessageSearchSources(assistantMessageId, browsable, targetChatId)
          }
        },
        onSearchVisiting: ({ url }) => {
          if (!isAgentRunActive(runId)) return
          setPipelineSearchActiveUrlForChat(targetChatId, url)
        },
        onThinkingDelta: ({ text }) => {
          if (!isAgentRunActive(runId)) return
          setPipelineSearchActiveUrlForChat(targetChatId, null)
          hasThinkingStream = true
          finalThinkingText = text
          setPipelineStageForChat(targetChatId, 'thinking')
          ensureThinkingPlaceholder()
          thinkingSync.push(text)
        },
        onTextDelta: ({ text }) => {
          if (!isAgentRunActive(runId)) return
          setPipelineSearchActiveUrlForChat(targetChatId, null)
          if (useConversationStore.getState().error === SEARCH_FALLBACK_NOTICE) {
            setPipelineErrorForChat(targetChatId, null)
          }
          const effects = applyTextDeltaToTurn(
            { finalText, finalThinkingText, hasThinkingStream },
            text,
            Boolean(thinkingMessageId)
          )
          finalText = effects.accumulators.finalText
          finalThinkingText = effects.accumulators.finalThinkingText
          hasThinkingStream = effects.accumulators.hasThinkingStream
          if (effects.removeThinkingPlaceholder && thinkingMessageId) {
            removeMessage(thinkingMessageId, targetChatId)
            thinkingMessageId = null
          }
          if (effects.flushThinkingNow) {
            thinkingSync.flushNow(finalThinkingText)
          }
          if (effects.pushAnswerToSync) {
            setPipelineStreamingAnswerForChat(targetChatId, true)
            clearPipelineDetailForChat(targetChatId)
            streamSync.push(text)
            feedAnswerTts(finalText)
          }
          persistTurnSearchSources()
        },
        onDone: ({ text }) => {
          if (!isAgentRunActive(runId)) return
          streamCompleted = true
          const thinkingContent =
            !finalThinkingText.trim() && thinkingMessageId
              ? (useChatsStore
                  .getState()
                  .chats.find((c) => c.id === targetChatId)
                  ?.messages.find((m) => m.id === thinkingMessageId)
                  ?.content.trim() ?? '')
              : ''
          const effects = applyDoneToTurn(
            { finalText, finalThinkingText, hasThinkingStream },
            text,
            thinkingContent
          )
          finalText = effects.accumulators.finalText
          finalThinkingText = effects.accumulators.finalThinkingText
          hasThinkingStream = effects.accumulators.hasThinkingStream
          thinkingSync.flushNow(effects.flushThinkingText)
          if (effects.flushAnswerText) {
            streamSync.flushNow(effects.flushAnswerText)
            feedAnswerTts(finalText)
          }
          setPipelineStreamingAnswerForChat(targetChatId, false)
          persistTurnSearchSources()
        }
      }
    )

    session.setStreamController(stream)
    session.setStreamTargetChatId(targetChatId)
    session.setStreamActive(true)
    setAgentStreamSession(targetChatId, true)
    // IPC abort resolves `stream.done` without throwing; post-await paths check `isAgentRunActive`.
    await stream.done

    const chatMessagesAfterStream =
      useChatsStore.getState().chats.find((c) => c.id === targetChatId)?.messages ?? []
    ;({
      thinkingMessageId,
      assistantMessageId,
      finalText,
      finalThinkingText
    } = reconcileTurnMessagesFromStore(
      chatMessagesAfterStream,
      thinkingMessageId,
      assistantMessageId,
      finalText,
      finalThinkingText
    ))

    if (finalThinkingText.trim()) {
      thinkingSync.flushNow(finalThinkingText)
    }
    if (finalText.trim()) {
      streamSync.flushNow(finalText)
    }

    endAgentTurnStreamBinding(targetChatId, session)
    setPipelineSearchActiveUrlForChat(targetChatId, null)
    setPipelineStreamingAnswerForChat(targetChatId, false)
    persistTurnSearchSources()
    if (isAgentRunActive(runId)) {
      const awaitingTts = playTts && finalText.trim() && isViewingChat(targetChatId)
      if (!awaitingTts) {
        setPipelineStageForChat(targetChatId, 'idle')
      }
    }

    if (!isAgentRunActive(runId)) {
      const keepTail =
        streamCompleted &&
        hasPersistedAssistantTurn(targetChatId, assistantMessageId, finalText, {
          streamCompleted: true
        })
      if (!keepTail) {
        removeAgentTurnTail(
          removeMessagesFrom,
          targetChatId,
          thinkingMessageId,
          assistantMessageId
        )
        discardPendingSync = true
      }
      setPipelineStageForChat(targetChatId, 'idle')
      return keepTail
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

    const completeTurnAfterReply = async (): Promise<void> => {
      if (!isAgentRunActive(runId)) {
        finalizeAgentTurnPipeline(targetChatId)
        return
      }
      finishAgentTurnForChat(targetChatId, agentSpeechMode, onLiveConversationTurnComplete)
      await tryRunPendingAgentReply(targetChatId)
      if (hasQueued) {
        await processNextInQueue(targetChatId)
      }
    }

    const playAnswerTts = async (): Promise<void> => {
      if (!playTts || !finalText.trim() || !isViewingTargetChat) return

      const tts = ensureAnswerTts()
      if (!tts) return

      try {
        await finishStreamingTtsPlayback(tts, finalText, (message) => {
          if (isAgentRunActive(runId)) {
            setError(message, targetChatId)
          }
        })
      } finally {
        if (session.getStreamingTts() === tts) {
          session.setStreamingTts(null)
        }
        answerTts = null
      }
    }

    if (!isViewingTargetChat) {
      await completeTurnAfterReply()
      return true
    }

    setBlurAnimateMessageId(assistantMessageId)

    if (hasQueued && playTts && finalText.trim()) {
      const nextQueued = useMessageQueueStore.getState().getQueue(targetChatId)[0]
      const preview = formatQueuePreview(nextQueued)
      if (preview) useConversationStore.getState().setQueueAheadPreview(preview)
    }

    await playAnswerTts()
    await completeTurnAfterReply()
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
        discardPendingSync = true
      } else {
        removeAgentTurnTailUnlessPersisted(
          removeMessagesFrom,
          targetChatId,
          thinkingMessageId,
          assistantMessageId,
          finalText,
          { streamCompleted }
        )
      }
      setPipelineStageForChat(targetChatId, 'idle')
      return false
    }

    if (aborted) {
      session.getStreamingTts()?.cancel()
      session.setStreamingTts(null)
      removeAgentTurnTail(
        removeMessagesFrom,
        targetChatId,
        thinkingMessageId,
        assistantMessageId
      )
      discardPendingSync = true
      setPipelineStageForChat(targetChatId, 'idle')
      return false
    }

    removeAgentTurnTail(
      removeMessagesFrom,
      targetChatId,
      thinkingMessageId,
      assistantMessageId
    )
    discardPendingSync = true
    if (isViewingChat(targetChatId)) setBlurAnimateMessageId(null)
    if (msg.includes('NO_OPENROUTER_KEY')) {
      setError('Add your OpenRouter API key in Settings.', targetChatId)
    } else if (msg.includes('TTS_EMPTY')) {
      setError(
        'Speech synthesis returned no audio. The text reply is still in the chat.',
        targetChatId
      )
      setPipelineStageForChat(targetChatId, 'idle')
      if (agentSpeechMode && isViewingChat(targetChatId)) {
        onLiveConversationTurnComplete?.()
      }
    } else {
      setError(formatLlmError(msg), targetChatId)
      setPipelineStageForChat(targetChatId, 'idle')
    }
    return false
  } finally {
    if (discardPendingSync) {
      thinkingSync.discard()
      streamSync.discard()
    } else {
      thinkingSync.cancel()
      streamSync.cancel()
    }
    endAgentTurnStreamBinding(targetChatId, session)

    if (isAgentRunActive(runId)) {
      const tts = session.getStreamingTts()
      if (tts && !streamCompleted) {
        tts.cancel()
        session.setStreamingTts(null)
      }
    }

    finalizeAgentTurnPipeline(targetChatId)
  }
}
