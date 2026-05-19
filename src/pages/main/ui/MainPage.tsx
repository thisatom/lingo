import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAiChat } from '@/features/ai-chat/model/useAiChat'
import { useChatContextUsage } from '@/features/chat-context/model/useChatContextUsage'
import { useChatComposerModeHotkey } from '@/features/chat-composer/model/useChatComposerModeHotkey'
import { useOpenRouterKey } from '@/features/manage-api-keys/model/useOpenRouterKey'
import { useLiveConversationLoop } from '@/features/voice-input/model/useLiveConversationLoop'
import { useVoiceInput } from '@/features/voice-input/model/useVoiceInput'
import { useChatsStore } from '@/entities/chat/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { ChatComposer } from '@/widgets/chat-composer/ui/ChatComposer'
import { ChatComposerError } from '@/widgets/chat-composer/ui/ChatComposerError'
import { ConversationPanel } from '@/widgets/conversation-panel/ui/ConversationPanel'
import { VoiceCaptureBar } from '@/features/audio-devices/ui/VoiceCaptureBar'
import { SidebarExpandButton } from '@/widgets/app-sidebar/ui/SidebarExpandButton'

function isErrorRetryable(message: string): boolean {
  return !message.includes('OpenRouter API key')
}

export function MainPage() {
  const {
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
    clearError
  } = useAiChat()
  const activeChat = useChatsStore((s) => s.getActiveChat())
  const activeChatId = activeChat?.id ?? null
  const draft = useChatsStore((s) =>
    activeChatId ? (s.composerDraftByChatId?.[activeChatId] ?? '') : ''
  )
  const setComposerDraft = useChatsStore((s) => s.setComposerDraft)
  const { status } = useOpenRouterKey()
  const error = useConversationStore((s) => s.error)
  const speechError = useConversationStore((s) => s.speechError)
  const setSpeechError = useConversationStore((s) => s.setSpeechError)
  const chatComposerMode = useSettingsStore((s) => s.chatComposerMode)
  const modelId = useSettingsStore((s) => s.modelId)
  const microphoneDeviceId = useSettingsStore((s) => s.microphoneDeviceId)
  const microphoneLabel = useSettingsStore((s) => s.microphoneLabel)
  const { percent: contextUsagePercent, resetContext, showIndicator } =
    useChatContextUsage(messages, modelId)

  useChatComposerModeHotkey()

  const setDraft = useCallback(
    (value: string) => {
      if (!activeChatId) return
      setComposerDraft(activeChatId, value)
    },
    [activeChatId, setComposerDraft]
  )

  const voiceMessageIdRef = useRef('')

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
        await commitVoiceUserMessage(messageId)
      },
      onConversationCancel: (messageId: string) => {
        voiceMessageIdRef.current = ''
        cancelVoiceUserMessage(messageId)
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

  const agentBusy =
    stage === 'thinking' || stage === 'searching' || stage === 'speaking'
  const voiceBusy = voice.isBusy
  const actionsDisabled = agentBusy || voiceBusy

  const showRecording =
    voice.isTranscribing || (voice.isBusy && voice.backend === 'local')

  const showErrorBanner = Boolean(error)
  const showSpeechError = Boolean(speechError) && !showRecording
  const errorRetryable = error ? isErrorRetryable(error) && messages.length > 0 : false

  const liveConversation = useLiveConversationLoop({
    mode: chatComposerMode,
    stage,
    voiceBusy,
    agentBusy,
    speechError,
    onStartListening: startVoiceCapture
  })

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

  const handleStopAgent = useCallback(() => {
    liveConversation.stopLiveConversation()
    stopAgent()
  }, [liveConversation, stopAgent])

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
      liveConversation.stopLiveConversation()
      void voice.cancel()
      setSpeechError(null)
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
    setSpeechError,
    startVoiceCapture,
    status?.isSet,
    voice
  ])

  const onVoiceCancel = useCallback(() => {
    void voice.cancel()
  }, [voice])

  const chatComposerModeRef = useRef(chatComposerMode)
  useEffect(() => {
    const prev = chatComposerModeRef.current
    chatComposerModeRef.current = chatComposerMode
    if (prev === chatComposerMode) return

    if (chatComposerMode === 'text') {
      liveConversation.stopLiveConversation()
      if (voice.isBusy) void voice.cancel()
    }
  }, [chatComposerMode, liveConversation, voice])

  const onSend = useCallback(async () => {
    if (!status?.isSet) return
    const text = draft
    if (activeChatId) setComposerDraft(activeChatId, '')
    setSpeechError(null)
    await sendUserMessage(text)
  }, [activeChatId, draft, sendUserMessage, setComposerDraft, setSpeechError, status?.isSet])

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="relative z-10 flex shrink-0 items-center gap-2 bg-background px-4 py-2">
        <SidebarExpandButton />
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {activeChat?.title ?? 'New chat'}
        </h1>
      </header>

      {!status?.isSet && (
        <div className="relative z-10 shrink-0 border-b border-border/40 bg-background px-4 py-2.5 text-sm text-muted-foreground">
          Add your{' '}
          <Link
            to="/settings/user"
            className="text-foreground underline-offset-4 hover:underline"
          >
            OpenRouter API key
          </Link>{' '}
          in Settings to start.
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <ConversationPanel
          messages={messages}
          stage={stage}
          activeChatId={activeChat?.id ?? null}
          actionsDisabled={actionsDisabled}
          onSubmitEditedUserMessage={submitEditedUserMessage}
          onRegenerateAssistantMessage={(messageId) => {
            void regenerateAssistantMessage(messageId)
          }}
        />

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[12] h-24 bg-gradient-to-t from-background to-transparent"
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
          <div className="pointer-events-auto mx-auto w-full max-w-3xl space-y-2 px-4 pb-3">
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

            <ChatComposer
              value={draft}
              onChange={setDraft}
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
              placeholder={status?.isSet ? 'Send follow-up' : 'Add API key in Settings…'}
              contextUsagePercent={showIndicator ? contextUsagePercent : undefined}
              onResetContext={showIndicator ? resetContext : undefined}
              overlay
            />
          </div>
        </div>
      </div>
    </div>
  )
}
