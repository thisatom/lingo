import { Link } from 'react-router-dom'
import { useAiChat } from '@/features/ai-chat/model/useAiChat'
import { useOpenRouterKey } from '@/features/manage-api-keys/model/useOpenRouterKey'
import { useVoiceCapture } from '@/features/voice-capture/model/useVoiceCapture'
import GradualBlur from '@/shared/ui/gradual-blur'
import { ChatComposer } from '@/widgets/chat-composer/ui/ChatComposer'
import { ConversationPanel } from '@/widgets/conversation-panel/ui/ConversationPanel'
import { TtsToggleButton } from '@/features/text-to-speech/ui/TtsToggleButton'
import { SidebarExpandButton } from '@/widgets/app-sidebar/ui/SidebarExpandButton'
import { RecordingIndicator } from '@/widgets/recording-indicator/ui/RecordingIndicator'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useChatsStore } from '@/entities/chat/model/store'

export function MainPage() {
  const {
    messages,
    stage,
    sendUserMessage,
    submitEditedUserMessage,
    regenerateAssistantMessage,
    stopAgent
  } = useAiChat()
  const activeChat = useChatsStore((s) => s.getActiveChat())
  const activeChatId = activeChat?.id ?? null
  const draft = useChatsStore((s) =>
    activeChatId ? (s.composerDraftByChatId?.[activeChatId] ?? '') : ''
  )
  const setComposerDraft = useChatsStore((s) => s.setComposerDraft)
  const { status } = useOpenRouterKey()
  const voice = useVoiceCapture()
  const error = useConversationStore((s) => s.error)

  const setDraft = (value: string) => {
    if (!activeChatId) return
    setComposerDraft(activeChatId, value)
  }

  const isTranscribing = stage === 'transcribing'
  const agentBusy = stage === 'thinking' || stage === 'speaking'
  const voiceBusy = isTranscribing || voice.isListening
  const actionsDisabled = agentBusy || voiceBusy

  const showRecording =
    voice.isListening || !!voice.interimTranscript || isTranscribing

  const onSend = async () => {
    if (!status?.isSet) return
    const text = draft
    if (activeChatId) setComposerDraft(activeChatId, '')
    await sendUserMessage(text)
  }

  const onVoicePress = () => {
    if (!status?.isSet || actionsDisabled || !voice.supported) return
    void voice.startListeningSession((text) => {
      if (!text.trim()) return
      void sendUserMessage(text)
    })
  }

  const onVoiceRelease = () => {
    if (voice.isListening) voice.stopListening()
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="relative z-10 flex shrink-0 items-center gap-2 border-b border-border/60 bg-background px-4 py-2">
        <SidebarExpandButton />
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {activeChat?.title ?? 'New chat'}
        </h1>
        <TtsToggleButton />
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

      {!voice.supported && status?.isSet && (
        <p className="relative z-10 shrink-0 bg-background px-4 py-1.5 text-xs text-muted-foreground">
          Voice input unavailable — use the text field below.
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

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-20">
          <GradualBlur
            position="bottom"
            height="100%"
            strength={1.5}
            divCount={4}
            zIndex={1}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
          <div className="pointer-events-auto mx-auto w-full max-w-3xl space-y-1.5 px-4 pb-3">
            {showRecording && (
              <RecordingIndicator
                isListening={voice.isListening}
                interimTranscript={voice.interimTranscript}
                isTranscribing={isTranscribing}
              />
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}

            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSend={() => void onSend()}
              onStop={stopAgent}
              disabled={!status?.isSet}
              agentBusy={agentBusy}
              voiceBusy={voiceBusy}
              voiceSupported={voice.supported}
              isListening={voice.isListening}
              onVoicePress={onVoicePress}
              onVoiceRelease={onVoiceRelease}
              placeholder={status?.isSet ? 'Send follow-up' : 'Add API key in Settings…'}
              overlay
            />
          </div>
        </div>
      </div>
    </div>
  )
}
