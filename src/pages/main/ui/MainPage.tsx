import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAiChat } from '@/features/ai-chat/model/useAiChat'
import { useLlmChatReady } from '@/features/ai-chat/model/useLlmChatReady'
import { useChatContextUsage } from '@/features/chat-context/model/useChatContextUsage'
import { useChatComposerModeHotkey } from '@/features/chat-composer/model/useChatComposerModeHotkey'
import { useVoiceInput } from '@/features/voice-input/model/useVoiceInput'
import { useLiveConversationLoop } from '@/features/voice-input/model/useLiveConversationLoop'
import {
  isPendingComposerChatId,
  isPendingVoiceMessageId,
  PENDING_COMPOSER_CHAT_ID,
  PENDING_VOICE_MESSAGE_ID,
  resolveComposerChatId
} from '@/entities/chat/lib/pending-composer'
import { useChatsStore } from '@/entities/chat/model/store'
import type { Message } from '@/entities/message/model/types'
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
import { flushChatScrollPositions } from '@/app/lib/chat-scroll-registry'
import { flushChatPersistDebounce } from '@/entities/chat/lib/chat-persist-storage'
import { ConversationPanel } from '@/widgets/conversation-panel/ui/ConversationPanel'
import type { EditSpeechTarget } from '@/widgets/conversation-panel/lib/edit-speech-target'
import { VoiceCaptureBar } from '@/features/audio-devices/ui/VoiceCaptureBar'
import { CHAT_COLUMN_MAX_WIDTH_CLASS } from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'
import { SidebarExpandButton } from '@/widgets/app-sidebar/ui/SidebarExpandButton'
import { BackgroundStreamHint } from '@/features/ai-chat/ui/BackgroundStreamHint'

function isErrorRetryable(message: string): boolean {
  return !message.includes('OpenRouter API key')
}

export function MainPage() {
  const [chatAtBottom, setChatAtBottom] = useState(true)
  const [showScrollToLatest, setShowScrollToLatest] = useState(false)
  const chatScrollRef = useRef<{
    scrollToLatest: (behavior?: ScrollBehavior) => void
    followBottom: () => void
  } | null>(null)

  const scheduleAutoListenRef = useRef<(() => void) | null>(null)
  const syncSessionChatIdRef = useRef<(chatId: string) => void>(() => undefined)

  const {
    messages,
    stage,
    agentBusy,
    agentPhase,
    forceStopAgent,
    backgroundStreamChatId,
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
  const selectChat = useChatsStore((s) => s.selectChat)
  const composerChatId = resolveComposerChatId(activeChatId)
  const draft = useChatsStore(
    (s) => s.composerDraftByChatId?.[composerChatId] ?? ''
  )
  const composerAttachments = useChatsStore(
    (s) => s.composerAttachmentsByChatId[composerChatId] ?? EMPTY_COMPOSER_ATTACHMENTS
  )
  const setComposerDraft = useChatsStore((s) => s.setComposerDraft)
  const addComposerAttachments = useChatsStore((s) => s.addComposerAttachments)
  const removeComposerAttachment = useChatsStore((s) => s.removeComposerAttachment)
  const { ready: llmChatReady, blockedReason: llmBlockedReason } = useLlmChatReady()
  const error = useConversationStore((s) => s.error)
  const speechError = useConversationStore((s) => s.speechError)
  const setSpeechError = useConversationStore((s) => s.setSpeechError)
  const chatComposerMode = useSettingsStore((s) => s.chatComposerMode)
  const llmBackend = useSettingsStore((s) => s.llmBackend)
  const modelId = useSettingsStore((s) => s.modelId)
  const customModelId = useSettingsStore((s) => s.customModelId)
  const activeModelId = llmBackend === 'custom' ? customModelId : modelId
  const microphoneDeviceId = useSettingsStore((s) => s.microphoneDeviceId)
  const microphoneLabel = useSettingsStore((s) => s.microphoneLabel)
  const { usage: contextUsage } = useChatContextUsage(
    messages,
    activeModelId
  )

  useChatComposerModeHotkey()

  const setDraft = useCallback(
    (value: string) => {
      setComposerDraft(composerChatId, value)
    },
    [composerChatId, setComposerDraft]
  )

  const handleAddAttachments = useCallback(
    (items: MessageAttachment[]) => {
      addComposerAttachments(composerChatId, items)
    },
    [composerChatId, addComposerAttachments]
  )

  const handleRemoveAttachment = useCallback(
    (id: string) => {
      removeComposerAttachment(composerChatId, id)
    },
    [composerChatId, removeComposerAttachment]
  )

  const handleAttachmentError = useCallback(
    (msg: string) => setSpeechError(msg),
    [setSpeechError]
  )

  const voiceMessageIdRef = useRef('')
  const voiceCaptureChatIdRef = useRef<string | null>(null)
  const [liveVoiceUserMessageId, setLiveVoiceUserMessageId] = useState<string | null>(null)
  const isLiveConversationActiveRef = useRef(false)
  const editSpeechTargetRef = useRef<EditSpeechTarget | null>(null)

  const startVoiceCaptureRef = useRef<(() => Promise<void>) | null>(null)

  const removeMessagesAfter = useChatsStore((s) => s.removeMessagesAfter)

  const voiceHandlers = useMemo(
    () => ({
      mode: chatComposerMode,
      isEditSpeech: () => editSpeechTargetRef.current != null,
      onTextDraft: (text: string) => {
        if (editSpeechTargetRef.current) {
          editSpeechTargetRef.current.setText(text)
        } else {
          setDraft(text)
        }
      },
      onConversationStart: () => {
        const { messageId, chatId } = beginVoiceUserMessage()
        if (!messageId) return null
        voiceMessageIdRef.current = messageId
        voiceCaptureChatIdRef.current = chatId
        setLiveVoiceUserMessageId(messageId)
        return messageId
      },
      onConversationLive: (text: string) => {
        const chatId = voiceCaptureChatIdRef.current
        if (voiceMessageIdRef.current && chatId) {
          updateVoiceUserMessage(voiceMessageIdRef.current, text, chatId)
        }
      },
      onConversationCommit: async (messageId: string) => {
        const captureChatId = voiceCaptureChatIdRef.current
        voiceMessageIdRef.current = ''
        voiceCaptureChatIdRef.current = null
        setLiveVoiceUserMessageId(null)
        if (!captureChatId) return

        const trimmed = isPendingComposerChatId(captureChatId)
          ? useChatsStore.getState().getComposerDraft(PENDING_COMPOSER_CHAT_ID).trim()
          : (useChatsStore
              .getState()
              .chats.find((c) => c.id === captureChatId)
              ?.messages.find((m) => m.id === messageId)
              ?.content.trim() ?? '')

        if (!trimmed) {
          cancelVoiceUserMessage(messageId, captureChatId)
          if (isLiveConversationActiveRef.current) {
            scheduleAutoListenRef.current?.()
          }
          return
        }

        const realChatId = await commitVoiceUserMessage(messageId, captureChatId)
        if (realChatId) {
          syncSessionChatIdRef.current(realChatId)
        }
        if (isLiveConversationActiveRef.current) {
          scheduleAutoListenRef.current?.()
        }
      },
      onConversationCancel: (messageId: string) => {
        const chatId = voiceCaptureChatIdRef.current
        voiceMessageIdRef.current = ''
        voiceCaptureChatIdRef.current = null
        setLiveVoiceUserMessageId(null)
        if (chatId) cancelVoiceUserMessage(messageId, chatId)
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
    const editTarget = editSpeechTargetRef.current
    if (editTarget) {
      stopAgent({ chatId: activeChatId ?? undefined, force: !activeChatId })
      if (activeChatId) {
        removeMessagesAfter(editTarget.messageId, activeChatId)
      }
      voice.setDraftPrefix(editTarget.getPrefix())
    } else if (chatComposerMode === 'text') {
      voice.setDraftPrefix(draft)
    }
    const started = await voice.start()
    if (!started) {
      setSpeechError('Could not start microphone. Check permissions in Settings → Devices.')
    }
  }, [
    activeChatId,
    chatComposerMode,
    draft,
    removeMessagesAfter,
    setSpeechError,
    stopAgent,
    voice
  ])

  startVoiceCaptureRef.current = startVoiceCapture

  const voiceBusy = voice.isBusy
  const actionsDisabled = agentBusy || voiceBusy
  const liveConversation = useLiveConversationLoop({
    mode: chatComposerMode,
    voiceStage: stage,
    agentPhase,
    voiceBusy,
    speechError,
    onStartListening: () => {
      void startVoiceCaptureRef.current?.()
    }
  })

  scheduleAutoListenRef.current = liveConversation.scheduleAutoListen
  syncSessionChatIdRef.current = liveConversation.syncSessionChatId

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

    if (editSpeechTargetRef.current) {
      const target = editSpeechTargetRef.current
      if (text) target.setText(text)
      setSpeechError(null)
      return
    }

    if (!text) return

    if (chatComposerMode === 'text') {
      setSpeechError(null)
      voice.setDraftPrefix('')
      await sendUserMessage(text)
    }
  }, [chatComposerMode, sendUserMessage, setSpeechError, voice])

  const stopAgentSpeechSession = useCallback(() => {
    liveConversation.stopLiveConversation()
    void voice.cancel()
    if (voiceMessageIdRef.current && voiceCaptureChatIdRef.current) {
      cancelVoiceUserMessage(voiceMessageIdRef.current, voiceCaptureChatIdRef.current)
      voiceMessageIdRef.current = ''
      voiceCaptureChatIdRef.current = null
    }
    setLiveVoiceUserMessageId(null)
    forceStopAgent()
    setSpeechError(null)
  }, [cancelVoiceUserMessage, forceStopAgent, liveConversation, setSpeechError, voice])

  const handleStopAgent = useCallback(() => {
    stopAgentSpeechSession()
  }, [stopAgentSpeechSession])

  const onVoicePress = useCallback(() => {
    if (!llmChatReady || !voice.supported) return

    if (chatComposerMode === 'text') {
      if (actionsDisabled && !editSpeechTargetRef.current) return
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
    liveConversation.startLiveConversation(resolveComposerChatId(activeChatId))
    void startVoiceCapture()
  }, [
    actionsDisabled,
    activeChatId,
    agentBusy,
    chatComposerMode,
    handleStopAgent,
    liveConversation,
    onVoiceStop,
    startVoiceCapture,
    llmChatReady,
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

  const prevActiveChatIdRef = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevActiveChatIdRef.current
    const next = activeChatId ?? null
    if (prev && prev !== next) {
      if (chatComposerMode === 'conversation' && liveConversation.isLiveConversationActive) {
        stopAgentSpeechSession()
      } else if (voice.isBusy) {
        void voice.cancel()
      }
    }
    prevActiveChatIdRef.current = next
  }, [
    activeChatId,
    chatComposerMode,
    liveConversation.isLiveConversationActive,
    stopAgentSpeechSession,
    voice
  ])

  const displayMessages = useMemo((): Message[] => {
    if (!isPendingVoiceMessageId(liveVoiceUserMessageId ?? '')) return messages
    return [
      ...messages,
      {
        id: PENDING_VOICE_MESSAGE_ID,
        role: 'user',
        content: draft,
        createdAt: Date.now()
      }
    ]
  }, [draft, liveVoiceUserMessageId, messages])

  const onSend = useCallback(async () => {
    if (!llmChatReady) return
    const text = draft
    const attachments = [...composerAttachments]
    if (!text.trim() && attachments.length === 0) return

    setSpeechError(null)
    chatScrollRef.current?.followBottom()
    voice.setDraftPrefix('')

    useChatsStore.getState().ensureActiveChat()
    await sendUserMessage(text, attachments)
  }, [
    composerAttachments,
    draft,
    sendUserMessage,
    setSpeechError,
    llmChatReady,
    voice
  ])

  useEffect(() => {
    if (!activeChatId) return
    void flushQueuedMessages(activeChatId)
  }, [activeChatId, agentBusy, backgroundStreamChatId, flushQueuedMessages, queuedMessages.length])

  useEffect(() => {
    return () => {
      flushChatScrollPositions()
      flushChatPersistDebounce()
    }
  }, [])

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="relative z-10 flex shrink-0 items-center gap-2 bg-background p-2">
        <SidebarExpandButton />
        <ChatHeaderTitle
          title={activeChat?.title ?? 'New chat'}
          chat={activeChat}
          messageCount={messages.length}
          modelId={activeModelId}
          contextUsage={contextUsage}
          contextPercent={contextUsage?.percent ?? 0}
        />
        <ChatHeaderMenu chatId={activeChatId} messages={messages} />
      </header>

      <div className="relative min-h-0 flex-1">
        <ConversationPanel
          messages={displayMessages}
          stage={stage}
          activeChatId={activeChat?.id ?? null}
          actionsDisabled={actionsDisabled}
          agentBusy={agentBusy}
          onStopAgent={handleStopAgent}
          voiceSupported={voice.supported}
          voiceBusy={voiceBusy}
          isVoiceListening={voice.isRecording}
          onVoicePress={onVoicePress}
          onVoiceStop={onVoiceStop}
          liveVoiceUserMessageId={liveVoiceUserMessageId}
          onRegisterEditSpeech={(target) => {
            editSpeechTargetRef.current = target
          }}
          onSubmitEditedUserMessage={submitEditedUserMessage}
          onAttachmentError={handleAttachmentError}
          onAtBottomChange={setChatAtBottom}
          onShowScrollToLatestChange={setShowScrollToLatest}
          onScrollToLatestReady={(api) => {
            chatScrollRef.current = api
          }}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[50]">
          <div
            className={cn(
              'pointer-events-auto mx-auto w-full px-4 pb-3 sm:px-6',
              CHAT_COLUMN_MAX_WIDTH_CLASS
            )}
          >
            <div className="relative">
              <ScrollToLatestButton
                show={showScrollToLatest}
                onClick={() => chatScrollRef.current?.followBottom()}
                className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2"
              />
              <div className="space-y-1">
            {backgroundStreamChatId ? (
              <BackgroundStreamHint
                streamChatId={backgroundStreamChatId}
                onOpenChat={selectChat}
              />
            ) : null}

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

            {(voice.isRecording || voice.isTranscribing) && (
              <VoiceCaptureBar
                active={voice.isRecording}
                transcribing={voice.isTranscribing}
                deviceId={microphoneDeviceId}
                deviceLabel={microphoneLabel}
                stream={voice.monitorStream}
                onCancel={onVoiceCancel}
                onConfirm={onVoiceStop}
              />
            )}

            {queuedMessages.length > 0 ? (
              <ChatMessageQueue
                items={queuedMessages}
                onUpdate={updateQueuedMessage}
                onRemove={removeQueuedMessage}
                onSendNow={(id) => void sendQueuedMessageNow(id)}
              />
            ) : null}

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
                disabled={!llmChatReady}
                agentBusy={agentBusy}
                voiceBusy={voiceBusy}
                voiceSupported={voice.supported}
                isListening={voice.isRecording}
                onVoicePress={onVoicePress}
                onVoiceStop={onVoiceStop}
                voiceInteractionMode="toggle"
                liveConversationActive={liveConversation.isLiveConversationActive}
                placeholder={
                  !llmChatReady
                    ? (llmBlockedReason ?? 'Add API key in Settings…')
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
