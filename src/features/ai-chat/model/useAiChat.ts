import { useCallback, useRef } from 'react'
import { useChatsStore } from '@/entities/chat/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { stopTtsPlayback } from '@/features/text-to-speech/model/playTts'
import {
  createStreamingSentenceTts,
  type StreamingSentenceTts
} from '@/features/text-to-speech/model/streamingSentenceTts'
import { formatOpenRouterError } from '@/shared/lib/openrouter-errors'
import type { ChatStreamController } from '@/shared/types/ipc'
import { getLingo } from '@/shared/lib/lingo'
import { beginAgentRun, cancelAgentRun, isAgentRunActive } from './agent-run'

type ChatHistoryMessage = { role: 'user' | 'assistant'; content: string }

function getHistoryForChat(chatId: string): ChatHistoryMessage[] {
  const chat = useChatsStore.getState().chats.find((c) => c.id === chatId)
  return (
    chat?.messages
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content })) ?? []
  )
}

export function useAiChat() {
  const activeChat = useChatsStore((s) => s.getActiveChat())
  const addMessage = useChatsStore((s) => s.addMessage)
  const removeMessagesFrom = useChatsStore((s) => s.removeMessagesFrom)
  const updateUserMessageContent = useChatsStore((s) => s.updateUserMessageContent)
  const updateMessageContent = useChatsStore((s) => s.updateMessageContent)
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const modelId = useSettingsStore((s) => s.modelId)
  const chatComposerMode = useSettingsStore((s) => s.chatComposerMode)
  const webSearchEnabled = useSettingsStore((s) => s.webSearchEnabled)
  const stage = useConversationStore((s) => s.stage)
  const setStage = useConversationStore((s) => s.setStage)
  const setError = useConversationStore((s) => s.setError)
  const setBlurAnimateMessageId = useConversationStore((s) => s.setBlurAnimateMessageId)
  const streamControllerRef = useRef<ChatStreamController | null>(null)
  const streamingTtsRef = useRef<StreamingSentenceTts | null>(null)

  const messages = activeChat?.messages ?? []

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
      setStage(webSearchEnabled ? 'searching' : 'thinking')
      setError(null)

      const history = getHistoryForChat(targetChatId)
      let assistantMessageId: string | null = null
      let finalText = ''
      const playTts = chatComposerMode === 'conversation'
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
            webSearch: webSearchEnabled
          },
          {
            onSearching: () => {
              if (!isAgentRunActive(runId)) return
              if (useChatsStore.getState().activeChatId !== targetChatId) return
              setStage('searching')
            },
            onTextDelta: ({ text }) => {
              if (!isAgentRunActive(runId)) return
              if (useChatsStore.getState().activeChatId !== targetChatId) return
              finalText = text
              syncAssistantText(text)
              if (streamingTts) {
                streamingTts.feed(text)
              } else {
                setStage('idle')
              }
            },
            onDone: ({ text }) => {
              finalText = text
              syncAssistantText(text)
            }
          }
        )

        streamControllerRef.current = stream
        await stream.done

        if (!isAgentRunActive(runId)) {
          if (assistantMessageId) removeMessagesFrom(assistantMessageId)
          return
        }
        if (useChatsStore.getState().activeChatId !== targetChatId) {
          if (assistantMessageId) removeMessagesFrom(assistantMessageId)
          return
        }

        if (!finalText.trim() || !assistantMessageId) {
          if (assistantMessageId) removeMessagesFrom(assistantMessageId)
          throw new Error('Model returned an empty response')
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
          setStage('idle')
        }
      } catch (e) {
        if (!isAgentRunActive(runId)) return
        if (useChatsStore.getState().activeChatId !== targetChatId) return

        const msg = e instanceof Error ? e.message : 'Request failed'
        const aborted = msg.includes('aborted') || (e instanceof Error && e.name === 'AbortError')
        if (aborted) {
          streamingTts?.cancel()
          streamingTtsRef.current = null
          if (assistantMessageId) removeMessagesFrom(assistantMessageId)
          setStage('idle')
          return
        }

        if (assistantMessageId) removeMessagesFrom(assistantMessageId)
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
      practiceLanguage,
      removeMessagesFrom,
      setBlurAnimateMessageId,
      setError,
      setStage,
      chatComposerMode,
      webSearchEnabled,
      updateMessageContent
    ]
  )

  const sendUserMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return

      const chatId = useChatsStore.getState().activeChatId ?? useChatsStore.getState().ensureActiveChat()

      stopAgent()
      useConversationStore.getState().setSpeechError(null)
      addMessage({ role: 'user', content: trimmed }, chatId)
      await runAssistantReply(chatId)
    },
    [addMessage, runAssistantReply, stopAgent]
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
      await runAssistantReply(chat.id)
    },
    [cancelVoiceUserMessage, runAssistantReply, updateMessageContent]
  )

  const submitEditedUserMessage = useCallback(
    async (messageId: string, content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return

      const chat = useChatsStore.getState().getActiveChat()
      const message = chat?.messages.find((m) => m.id === messageId)
      if (!chat || !message || message.role !== 'user') return

      const chatId = chat.id

      stopAgent()
      updateUserMessageContent(messageId, trimmed)
      setBlurAnimateMessageId(null)
      setError(null)
      await runAssistantReply(chatId)
    },
    [
      runAssistantReply,
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
    sendUserMessage,
    beginVoiceUserMessage,
    updateVoiceUserMessage,
    commitVoiceUserMessage,
    cancelVoiceUserMessage,
    submitEditedUserMessage,
    regenerateAssistantMessage,
    stopAgent,
    retryLastRequest,
    clearError,
    activeChatId: activeChat?.id
  }
}
