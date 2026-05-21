import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAiChat } from '@/features/ai-chat/model/useAiChat'
import { useChatContextUsage } from '@/features/chat-context/model/useChatContextUsage'
import { useChatComposerModeHotkey } from '@/features/chat-composer/model/useChatComposerModeHotkey'
import { useOpenRouterKey } from '@/features/manage-api-keys/model/useOpenRouterKey'
import { useLiveConversationLoop } from '@/features/voice-input/model/useLiveConversationLoop'
import { useVoiceInput } from '@/features/voice-input/model/useVoiceInput'
import { useChatsStore } from '@/entities/chat/model/store'
import {
  EMPTY_COMPOSER_ATTACHMENTS,
  type MessageAttachment
} from '@/entities/message/model/attachment'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { ChatComposer } from '@/widgets/chat-composer/ui/ChatComposer'
import { ChatMessageQueue } from '@/widgets/chat-composer/ui/ChatMessageQueue'
import { ChatComposerError } from '@/widgets/chat-composer/ui/ChatComposerError'
import { ScrollToLatestButton } from '@/widgets/chat-composer/ui/ScrollToLatestButton'
import { ChatHeaderMenu } from '@/widgets/chat-header/ui/ChatHeaderMenu'
import { ChatHeaderTitle } from '@/widgets/chat-header/ui/ChatHeaderTitle'
import { ConversationPanel } from '@/widgets/conversation-panel/ui/ConversationPanel'
import { VoiceCaptureBar } from '@/features/audio-devices/ui/VoiceCaptureBar'
import { CHAT_COLUMN_MAX_WIDTH_CLASS } from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'
import { SidebarExpandButton } from '@/widgets/app-sidebar/ui/SidebarExpandButton'

function isErrorRetryable(message: string): boolean {
  return !message.includes('OpenRouter API key')
}

export function MainPage() {
  const [chatAtBottom, setChatAtBottom] = useState(true)
  const [showScrollToLatest, setShowScrollToLatest] = useState(false)
  const scrollToLatestRef = useRef<(() => void) | null>(null)

  const scheduleAutoListenRef = useRef<(() => void) | null>(null)

  const {
    messages,
    stage,
    queuedMessages,
    sendUserMessage,
    updateQueuedMessage,
    removeQueuedMessage,
    sendQueuedMessageNow,
    flushQueuedMessages,
    beginVoiceUserMessage,
    updateVoiceUserMessage,
    commitVoiceUserMessage,
    cancelVoiceUserMessage,
    submitEditedUserMessage,
    stopAgent,
    retryLastRequest,
    clearError
  } = useAiChat({
    onLiveConversationTurnComplete: () => scheduleAutoListenRef.current?.()
  })
  const activeChat = useChatsStore((s) => s.getActiveChat())
  const activeChatId = activeChat?.id ?? null
  const draft = useChatsStore((s) =>
    activeChatId ? (s.composerDraftByChatId?.[activeChatId] ?? '') : ''
  )
  const composerAttachments = useChatsStore((s) =>
    activeChatId
      ? (s.composerAttachmentsByChatId[activeChatId] ?? EMPTY_COMPOSER_ATTACHMENTS)
      : EMPTY_COMPOSER_ATTACHMENTS
  )
  const setComposerDraft = useChatsStore((s) => s.setComposerDraft)
  const addComposerAttachments = useChatsStore((s) => s.addComposerAttachments)
  const removeComposerAttachment = useChatsStore((s) => s.removeComposerAttachment)
  const { status } = useOpenRouterKey()
  const error = useConversationStore((s) => s.error)
  const speechError = useConversationStore((s) => s.speechError)
  const setSpeechError = useConversationStore((s) => s.setSpeechError)
  const chatComposerMode = useSettingsStore((s) => s.chatComposerMode)
  const modelId = useSettingsStore((s) => s.modelId)
  const microphoneDeviceId = useSettingsStore((s) => s.microphoneDeviceId)
  const microphoneLabel = useSettingsStore((s) => s.microphoneLabel)
  const { usage: contextUsage } = useChatContextUsage(
    messages,
    modelId
  )

  useChatComposerModeHotkey()

  const setDraft = useCallback(
    (value: string) => {
      if (!activeChatId) return
      setComposerDraft(activeChatId, value)
    },
    [activeChatId, setComposerDraft]
  )

  const handleAddAttachments = useCallback(
    (items: MessageAttachment[]) => {
      if (!activeChatId) return
      addComposerAttachments(activeChatId, items)
    },
    [activeChatId, addComposerAttachments]
  )

  const handleRemoveAttachment = useCallback(
    (id: string) => {
      if (!activeChatId) return
      removeComposerAttachment(activeChatId, id)
    },
    [activeChatId, removeComposerAttachment]
  )

  const handleAttachmentError = useCallback(
    (msg: string) => setSpeechError(msg),
    [setSpeechError]
  )

  const voiceMessageIdRef = useRef('')
  const isLiveConversationActiveRef = useRef(false)

  const startVoiceCaptureRef = useRef<(() => Promise<void>) | null>(null)

  const voiceHandlers = useMemo(
    () => ({
      mode: chatComposerMode,
      onTextDraft: setDraft,
      onConversationStart: () => {
        const { messageId } = beginVoiceUserMessage()
        voiceMessageIdRef.current = messageId
        return messageId
      },
      onConversationLive: (text: string) => {
        if (voiceMessageIdRef.current) {
          updateVoiceUserMessage(voiceMessageIdRef.current, text)
        }
      },
      onConversationCommit: async (messageId: string) => {
        voiceMessageIdRef.current = ''
        const chat = useChatsStore.getState().getActiveChat()
        const trimmed =
          chat?.messages.find((m) => m.id === messageId)?.content.trim() ?? ''
        if (!trimmed) {
          cancelVoiceUserMessage(messageId)
          if (isLiveConversationActiveRef.current) {
            scheduleAutoListenRef.current?.()
          }
          return
        }
        await commitVoiceUserMessage(messageId)
      },
      onConversationCancel: (messageId: string) => {
        voiceMessageIdRef.current = ''
        cancelVoiceUserMessage(messageId)
        if (isLiveConversationActiveRef.current) {
          scheduleAutoListenRef.current?.()
        }
      }
    }),
    [
      beginVoiceUserMessage,
      cancelVoiceUserMessage,
      chatComposerMode,
      commitVoiceUserMessage,
      setDraft,
      updateVoiceUserMessage
    ]
  )

  const voice = useVoiceInput(voiceHandlers)

  const startVoiceCapture = useCallback(async () => {
    if (chatComposerMode === 'text') {
      voice.setDraftPrefix(draft)
    }
    const started = await voice.start()
    if (!started) {
      setSpeechError('Could not start microphone. Check permissions in Settings → Devices.')
    }
  }, [chatComposerMode, draft, setSpeechError, voice])

  startVoiceCaptureRef.current = startVoiceCapture

  const agentBusy =
    stage === 'thinking' || stage === 'searching' || stage === 'speaking'
  const voiceBusy = voice.isBusy
  const actionsDisabled = agentBusy || voiceBusy

  const liveConversation = useLiveConversationLoop({
    mode: chatComposerMode,
    stage,
    voiceBusy,
    agentBusy,
    speechError,
    onStartListening: () => {
      void startVoiceCaptureRef.current?.()
    }
  })

  scheduleAutoListenRef.current = liveConversation.scheduleAutoListen

  useEffect(() => {
    isLiveConversationActiveRef.current = liveConversation.isLiveConversationActive
  }, [liveConversation.isLiveConversationActive])

  const showRecording =
    voice.isTranscribing || (voice.isBusy && voice.backend === 'local')

  const showErrorBanner = Boolean(error)
  const showSpeechError = Boolean(speechError) && !showRecording
  const errorRetryable = error ? isErrorRetryable(error) && messages.length > 0 : false

  const onVoiceStop = useCallback(async () => {
    if (!voice.isBusy) return
    const text = (await voice.stop())?.trim() ?? ''

    if (chatComposerMode === 'text' && text) {
      if (activeChatId) setComposerDraft(activeChatId, '')
      setSpeechError(null)
      await sendUserMessage(text)
    }
  }, [
    activeChatId,
    chatComposerMode,
    sendUserMessage,
    setComposerDraft,
    setSpeechError,
    voice
  ])

  const stopAgentSpeechSession = useCallback(() => {
    liveConversation.stopLiveConversation()
    void voice.cancel()
    if (voiceMessageIdRef.current) {
      cancelVoiceUserMessage(voiceMessageIdRef.current)
      voiceMessageIdRef.current = ''
    }
    stopAgent()
    setSpeechError(null)
  }, [cancelVoiceUserMessage, liveConversation, setSpeechError, stopAgent, voice])

  const handleStopAgent = useCallback(() => {
    stopAgentSpeechSession()
  }, [stopAgentSpeechSession])

  const onVoicePress = useCallback(() => {
    if (!status?.isSet || !voice.supported) return

    if (chatComposerMode === 'text') {
      if (actionsDisabled) return
      void startVoiceCapture()
      return
    }

    if (liveConversation.isLiveConversationActive) {
      if (voice.isRecording) {
        void onVoiceStop()
        return
      }
      if (agentBusy) {
        handleStopAgent()
        return
      }
      stopAgentSpeechSession()
      return
    }

    if (actionsDisabled) return
    liveConversation.startLiveConversation()
    void startVoiceCapture()
  }, [
    actionsDisabled,
    agentBusy,
    chatComposerMode,
    handleStopAgent,
    liveConversation,
    onVoiceStop,
    startVoiceCapture,
    status?.isSet,
    stopAgentSpeechSession,
    voice
  ])

  const onVoiceCancel = useCallback(() => {
    if (chatComposerMode === 'conversation' && liveConversation.isLiveConversationActive) {
      stopAgentSpeechSession()
      return
    }
    void voice.cancel()
  }, [chatComposerMode, liveConversation.isLiveConversationActive, stopAgentSpeechSession, voice])

  const chatComposerModeRef = useRef(chatComposerMode)
  useEffect(() => {
    const prev = chatComposerModeRef.current
    chatComposerModeRef.current = chatComposerMode
    if (prev === chatComposerMode) return

    if (chatComposerMode === 'text') {
      stopAgentSpeechSession()
    }
  }, [chatComposerMode, stopAgentSpeechSession])

  const onSend = useCallback(async () => {
    if (!status?.isSet) return
    const text = draft
    const attachments = [...composerAttachments]
    if (activeChatId) setComposerDraft(activeChatId, '')
    setSpeechError(null)
    await sendUserMessage(text, attachments)
  }, [
    activeChatId,
    composerAttachments,
    draft,
    sendUserMessage,
    setComposerDraft,
    setSpeechError,
    status?.isSet
  ])

  const prevAgentBusyRef = useRef(agentBusy)
  useEffect(() => {
    const wasBusy = prevAgentBusyRef.current
    prevAgentBusyRef.current = agentBusy
    if (!activeChatId || agentBusy || !wasBusy) return
    if (queuedMessages.length === 0) return
    void flushQueuedMessages(activeChatId)
  }, [activeChatId, agentBusy, flushQueuedMessages, queuedMessages.length])

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="relative z-10 flex shrink-0 items-center gap-2 bg-background p-2">
        <SidebarExpandButton />
        <ChatHeaderTitle
          title={activeChat?.title ?? 'New chat'}
          chat={activeChat}
          messageCount={messages.length}
          modelId={modelId}
          contextUsage={contextUsage}
          contextPercent={contextUsage?.percent ?? 0}
        />
        <ChatHeaderMenu chatId={activeChatId} messages={messages} />
      </header>

      <div className="relative min-h-0 flex-1">
        <ConversationPanel
          messages={messages}
          stage={stage}
          activeChatId={activeChat?.id ?? null}
          actionsDisabled={actionsDisabled}
          onSubmitEditedUserMessage={submitEditedUserMessage}
          onAttachmentError={handleAttachmentError}
          onAtBottomChange={setChatAtBottom}
          onShowScrollToLatestChange={setShowScrollToLatest}
          onScrollToLatestReady={(scrollToLatest) => {
            scrollToLatestRef.current = scrollToLatest
          }}
        />

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[12] h-24 bg-gradient-to-t from-background to-transparent"
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
          <div
            className={cn(
              'pointer-events-auto mx-auto w-full px-4 pb-3 sm:px-6',
              CHAT_COLUMN_MAX_WIDTH_CLASS
            )}
          >
            <div className="relative">
              <ScrollToLatestButton
                show={showScrollToLatest}
                onClick={() => scrollToLatestRef.current?.()}
                className="absolute bottom-full right-0 z-50 mb-2 shrink-0"
              />
              <div className="space-y-1">
            {showSpeechError && speechError && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground"
              >
                <p className="min-w-0 flex-1 leading-snug">{speechError}</p>
                <button
                  type="button"
                  className="shrink-0 text-xs text-foreground/70 hover:text-foreground"
                  onClick={() => setSpeechError(null)}
                >
                  Dismiss
                </button>
              </div>
            )}

            {showErrorBanner && error && (
              <ChatComposerError
                message={error}
                onDismiss={clearError}
                onRetry={errorRetryable ? () => void retryLastRequest() : undefined}
                retrying={agentBusy}
              />
            )}

            {voice.isRecording && (
              <VoiceCaptureBar
                active
                deviceId={microphoneDeviceId}
                deviceLabel={microphoneLabel}
                stream={voice.monitorStream}
                onCancel={onVoiceCancel}
                onConfirm={onVoiceStop}
              />
            )}

            {queuedMessages.length > 0 && (
              <ChatMessageQueue
                items={queuedMessages}
                onUpdate={updateQueuedMessage}
                onRemove={removeQueuedMessage}
                onSendNow={(id) => void sendQueuedMessageNow(id)}
              />
            )}

              <ChatComposer
                focusChatId={activeChatId}
                value={draft}
                onChange={setDraft}
                attachments={composerAttachments}
                onAddAttachments={handleAddAttachments}
                onRemoveAttachment={handleRemoveAttachment}
                onAttachmentError={handleAttachmentError}
                onSend={() => void onSend()}
                onStop={handleStopAgent}
                disabled={!status?.isSet}
                agentBusy={agentBusy}
                voiceBusy={voiceBusy}
                voiceSupported={voice.supported}
                isListening={voice.isRecording}
                onVoicePress={onVoicePress}
                onVoiceStop={onVoiceStop}
                voiceInteractionMode="toggle"
                liveConversationActive={liveConversation.isLiveConversationActive}
                placeholder={
                  !status?.isSet
                    ? 'Add API key in Settings…'
                    : composerAttachments.length > 0
                      ? 'Ask about the image…'
                      : agentBusy
                        ? 'Queue follow-up…'
                        : 'Send follow-up'
                }
                overlay
              />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
