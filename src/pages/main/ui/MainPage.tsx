import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAiChat } from '@/features/ai-chat/model/useAiChat'
import { useChatComposerModeHotkey } from '@/features/chat-composer/model/useChatComposerModeHotkey'
import { useOpenRouterKey } from '@/features/manage-api-keys/model/useOpenRouterKey'
import {
  useVoiceInput,
  useVoiceInputBackend
} from '@/features/voice-input/model/useVoiceInput'
import { useChatsStore } from '@/entities/chat/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { ChatComposer } from '@/widgets/chat-composer/ui/ChatComposer'
import { ChatComposerError } from '@/widgets/chat-composer/ui/ChatComposerError'
import { ConversationPanel } from '@/widgets/conversation-panel/ui/ConversationPanel'
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
  const voiceBackend = useVoiceInputBackend()

  const agentBusy =
    stage === 'thinking' || stage === 'searching' || stage === 'speaking'
  const voiceBusy = voice.isBusy
  const actionsDisabled = agentBusy || voiceBusy

  const showRecording =
    voice.isTranscribing || (voice.isBusy && voice.backend === 'whisper')

  const showErrorBanner = Boolean(error)
  const showSpeechError = Boolean(speechError) && !showRecording
  const errorRetryable = error ? isErrorRetryable(error) && messages.length > 0 : false

  const onVoicePress = useCallback(() => {
    if (!status?.isSet || actionsDisabled || !voice.supported) return
    if (chatComposerMode === 'text') {
      voice.setDraftPrefix(draft)
    }
    void voice.start()
  }, [actionsDisabled, chatComposerMode, draft, status?.isSet, voice])

  const onVoiceStop = useCallback(() => {
    if (!voice.isBusy) return
    void voice.stop()
  }, [voice])

  useEffect(() => {
    if (chatComposerMode !== 'conversation' && voice.isBusy) {
      void voice.cancel()
    }
  }, [chatComposerMode, voice])

  const onSend = useCallback(async () => {
    if (!status?.isSet) return
    const text = draft
    if (activeChatId) setComposerDraft(activeChatId, '')
    setSpeechError(null)
    await sendUserMessage(text)
  }, [activeChatId, draft, sendUserMessage, setComposerDraft, setSpeechError, status?.isSet])

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="relative z-10 flex shrink-0 items-center gap-2 border-b border-border/60 bg-background px-4 py-2">
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

      {status?.isSet && voice.supported && (
        <p className="relative z-10 shrink-0 bg-background px-4 py-1.5 text-xs text-muted-foreground">
          {chatComposerMode === 'conversation'
            ? voiceBackend === 'browser'
              ? 'Tap mic to speak — your message appears live and sends when you stop. AI replies with voice.'
              : 'Tap mic to speak — message sends after Whisper transcription. AI replies with voice.'
            : voiceBackend === 'browser'
              ? 'Tap mic — speech appears in the field as you talk. Press Send when ready.'
              : 'Tap mic — speech is added to the field after transcription (Whisper).'}
        </p>
      )}

      {!voice.supported && status?.isSet && (
        <p className="relative z-10 shrink-0 bg-background px-4 py-1.5 text-xs text-muted-foreground">
          Voice input is not supported in this environment — use the text field below.
        </p>
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
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-t from-background to-transparent"
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

            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSend={() => void onSend()}
              onStop={stopAgent}
              disabled={!status?.isSet}
              agentBusy={agentBusy}
              voiceBusy={voiceBusy}
              voiceSupported={voice.supported}
              isListening={voice.isRecording}
              onVoicePress={onVoicePress}
              onVoiceStop={onVoiceStop}
              voiceInteractionMode="toggle"
              placeholder={status?.isSet ? 'Send follow-up' : 'Add API key in Settings…'}
              overlay
            />
          </div>
        </div>
      </div>
    </div>
  )
}
