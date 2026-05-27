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
import { setAgentStreamSession } from '@/features/ai-chat/lib/agent-stream-session'
import { getOtherChatStreamBlocking } from '@/features/ai-chat/lib/agent-stream-guard'
import {
  clearPipelineDetailForChat,
  isViewingChat,
  setPipelineErrorForChat,
  setPipelineSearchTargetsForChat,
  setPipelineStageForChat,
  setPipelineStreamingAnswerForChat
} from '@/features/ai-chat/lib/pipeline-stage'
import { reconcileTurnMessagesFromStore } from '@/features/ai-chat/lib/reconcile-turn-messages'
import { releaseStaleAgentPipelineStage } from '@/features/ai-chat/lib/release-stale-agent-pipeline'
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
import { messagesHaveImages } from '@/shared/lib/vision-models'
import { shouldRunWebSearch } from '@/shared/lib/web-search-intent'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import { formatQueuePreview } from '@/entities/message-queue/lib/format-queue-preview'
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
  const addMessage = useChatsStore.getState().addMessage
  const removeMessagesFrom = useChatsStore.getState().removeMessagesFrom
  const removeMessage = useChatsStore.getState().removeMessage
  const updateMessageContent = useChatsStore.getState().updateMessageContent

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
  let hasThinkingStream = false
  let finalText = ''
  const agentSpeechMode = chatComposerMode === 'conversation'
  const playTts = shouldPlayAgentTts(llmSettings.ttsEnabled, chatComposerMode)

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
          hasThinkingStream = true
          finalThinkingText = text
          setPipelineStageForChat(targetChatId, 'thinking')
          ensureThinkingPlaceholder()
          thinkingSync.push(text)
        },
        onTextDelta: ({ text }) => {
          if (!isAgentRunActive(runId)) return
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
          }
        },
        onDone: ({ text }) => {
          if (!isAgentRunActive(runId)) return
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
          }
        }
      }
    )

    session.setStreamController(stream)
    session.setStreamTargetChatId(targetChatId)
    session.setStreamActive(true)
    setAgentStreamSession(targetChatId, true)
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

    if (!isAgentRunActive(runId)) {
      if (!hasPersistedAssistantTurn(targetChatId, assistantMessageId, finalText)) {
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
      setPipelineStageForChat(targetChatId, 'idle')
      return true
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
    setPipelineStreamingAnswerForChat(targetChatId, false)

    const hasQueued = useMessageQueueStore.getState().getQueue(targetChatId).length > 0
    const isViewingTargetChat = isViewingChat(targetChatId)

    const playAnswerTts = async (): Promise<void> => {
      if (!playTts || !finalText.trim() || !isViewingTargetChat) return
      if (!isAgentRunActive(runId)) return

      setPipelineStageForChat(targetChatId, 'speaking')
      const tts = createStreamingSentenceTts({
        locale: practiceLanguage,
        runId,
        targetChatId
      })
      session.setStreamingTts(tts)
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
        if (!isAgentRunActive(runId)) {
          releaseStaleAgentPipelineStage(targetChatId)
        }
      }
    }

    if (!isViewingTargetChat) {
      if (isAgentRunActive(runId)) {
        if (hasQueued) {
          await processNextInQueue(targetChatId)
        } else {
          finishAgentTurnForChat(targetChatId, agentSpeechMode, onLiveConversationTurnComplete)
          await tryRunPendingAgentReply(targetChatId)
        }
      } else {
        releaseStaleAgentPipelineStage(targetChatId)
      }
      return true
    }

    setBlurAnimateMessageId(assistantMessageId)

    if (hasQueued && playTts && finalText.trim()) {
      const nextQueued = useMessageQueueStore.getState().getQueue(targetChatId)[0]
      const preview = formatQueuePreview(nextQueued)
      if (preview) useConversationStore.getState().setQueueAheadPreview(preview)
    }

    await playAnswerTts()

    if (isAgentRunActive(runId)) {
      if (hasQueued) {
        await processNextInQueue(targetChatId)
      } else {
        finishAgentTurnForChat(targetChatId, agentSpeechMode, onLiveConversationTurnComplete)
        await tryRunPendingAgentReply(targetChatId)
      }
    } else {
      releaseStaleAgentPipelineStage(targetChatId)
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
      session.getStreamingTts()?.cancel()
      session.setStreamingTts(null)
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
      if (agentSpeechMode && isViewingChat(targetChatId)) {
        onLiveConversationTurnComplete?.()
      }
    } else {
      setError(formatLlmError(msg), targetChatId)
      setPipelineStageForChat(targetChatId, 'idle')
    }
    return false
  } finally {
    thinkingSync.cancel()
    streamSync.cancel()
    session.setStreamController(null)
    if (session.getStreamTargetChatId() === targetChatId) {
      session.setStreamTargetChatId(null)
    }
    session.setStreamActive(false)
    setAgentStreamSession(null, false)
    releaseStaleAgentPipelineStage(targetChatId)
    session.getStreamingTts()?.cancel()
    session.setStreamingTts(null)
  }
}
