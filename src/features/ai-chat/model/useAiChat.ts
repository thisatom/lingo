import { useCallback } from 'react'
import { useChatsStore } from '@/entities/chat/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { playTtsFromBase64, stopTtsPlayback } from '@/features/text-to-speech/model/playTts'
import { getLingo } from '@/shared/lib/lingo'
import { beginAgentRun, cancelAgentRun, isAgentRunActive } from './agent-run'

type ChatHistoryMessage = { role: 'user' | 'assistant'; content: string }

function getHistoryForChat(chatId: string): ChatHistoryMessage[] {
  const chat = useChatsStore.getState().chats.find((c) => c.id === chatId)
  return chat?.messages.map((m) => ({ role: m.role, content: m.content })) ?? []
}

export function useAiChat() {
  const activeChat = useChatsStore((s) => s.getActiveChat())
  const addMessage = useChatsStore((s) => s.addMessage)
  const removeMessagesFrom = useChatsStore((s) => s.removeMessagesFrom)
  const updateUserMessageContent = useChatsStore((s) => s.updateUserMessageContent)
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const modelId = useSettingsStore((s) => s.modelId)
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled)
  const stage = useConversationStore((s) => s.stage)
  const setStage = useConversationStore((s) => s.setStage)
  const setError = useConversationStore((s) => s.setError)
  const setBlurAnimateMessageId = useConversationStore((s) => s.setBlurAnimateMessageId)

  const messages = activeChat?.messages ?? []

  const stopAgent = useCallback(() => {
    cancelAgentRun()
    stopTtsPlayback()
    setBlurAnimateMessageId(null)
    setStage('idle')
  }, [setBlurAnimateMessageId, setStage])

  const runAssistantReply = useCallback(
    async (targetChatId: string) => {
      const runId = beginAgentRun()
      setStage('thinking')
      setError(null)

      const history = getHistoryForChat(targetChatId)

      try {
        const { text } = await getLingo().chat.complete({
          messages: history,
          model: modelId,
          practiceLanguage
        })

        if (!isAgentRunActive(runId)) return
        if (useChatsStore.getState().activeChatId !== targetChatId) return

        const assistantMessageId = addMessage(
          { role: 'assistant', content: text },
          targetChatId
        )
        if (!assistantMessageId) return

        if (!isAgentRunActive(runId)) {
          removeMessagesFrom(assistantMessageId)
          return
        }
        if (useChatsStore.getState().activeChatId !== targetChatId) {
          removeMessagesFrom(assistantMessageId)
          return
        }

        setBlurAnimateMessageId(assistantMessageId)

        if (ttsEnabled) {
          setStage('speaking')

          const { audioBase64, mimeType } = await getLingo().tts.synthesize({
            text,
            locale: practiceLanguage
          })

          if (!isAgentRunActive(runId)) return
          if (useChatsStore.getState().activeChatId !== targetChatId) return

          try {
            await playTtsFromBase64(audioBase64, mimeType)
          } catch (playError) {
            if (!isAgentRunActive(runId)) return
            if (useChatsStore.getState().activeChatId !== targetChatId) return
            const playMsg = playError instanceof Error ? playError.message : 'PLAYBACK_FAILED'
            setError(
              playMsg.includes('PLAYBACK_FAILED')
                ? 'Could not play audio. The assistant reply is shown in the chat.'
                : playMsg
            )
          }
        }

        if (isAgentRunActive(runId) && useChatsStore.getState().activeChatId === targetChatId) {
          setStage('idle')
        }
      } catch (e) {
        if (!isAgentRunActive(runId)) return
        if (useChatsStore.getState().activeChatId !== targetChatId) return
        const msg = e instanceof Error ? e.message : 'Request failed'
        setBlurAnimateMessageId(null)
        if (msg.includes('NO_OPENROUTER_KEY')) {
          setError('Add your OpenRouter API key in Settings.')
        } else if (msg.includes('TTS_EMPTY')) {
          setError('Speech synthesis returned no audio. The text reply is still in the chat.')
          setStage('idle')
        } else {
          setError(msg)
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
      ttsEnabled
    ]
  )

  const sendUserMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return

      const chatId = useChatsStore.getState().activeChatId ?? useChatsStore.getState().ensureActiveChat()

      stopAgent()
      addMessage({ role: 'user', content: trimmed }, chatId)
      await runAssistantReply(chatId)
    },
    [addMessage, runAssistantReply, stopAgent]
  )

  const submitEditedUserMessage = useCallback(
    async (messageId: string, content: string) => {
      const chat = useChatsStore.getState().getActiveChat()
      const message = chat?.messages.find((m) => m.id === messageId)
      if (!chat || !message || message.role !== 'user') return
      const index = chat.messages.findIndex((m) => m.id === messageId)
      const hasRepliesAfter = index !== -1 && chat.messages.length > index + 1
      if (message.content.trim() === content.trim() && !hasRepliesAfter) return

      const chatId = chat.id

      stopAgent()
      updateUserMessageContent(messageId, content)
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

  return {
    messages,
    stage,
    sendUserMessage,
    submitEditedUserMessage,
    regenerateAssistantMessage,
    stopAgent,
    activeChatId: activeChat?.id
  }
}
