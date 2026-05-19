import { useCallback, useRef } from 'react'
import SpeechRecognition from 'react-speech-recognition'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import { useBrowserSpeechVoiceInput } from '@/features/voice-input/model/useBrowserSpeechVoiceInput'
import { useWhisperVoiceInput } from '@/features/voice-input/model/useWhisperVoiceInput'
import { isAudioCaptureSupported } from '@/features/voice-input/lib/record-session'
import { isLingoAvailable } from '@/shared/lib/lingo'

export type VoiceInputPhase = 'idle' | 'recording' | 'transcribing'

export interface LiveVoiceHandlers {
  mode: ChatComposerMode
  /** Text mode: live composer text (prefix + speech). */
  onTextDraft: (text: string) => void
  /** Conversation: live user bubble content. */
  onConversationLive: (text: string) => void
  onConversationStart: () => string
  onConversationCommit: (messageId: string) => Promise<void>
  onConversationCancel: (messageId: string) => void
}

export function useLiveVoiceInput(handlers: LiveVoiceHandlers) {
  const draftPrefixRef = useRef('')
  const conversationMessageIdRef = useRef('')

  const browserSupported =
    typeof window !== 'undefined' && SpeechRecognition.browserSupportsSpeechRecognition()

  const useBrowser = browserSupported
  const useWhisper = !useBrowser && isLingoAvailable() && isAudioCaptureSupported()

  const onLiveTranscript = useCallback(
    (spoken: string) => {
      if (handlers.mode === 'text') {
        const prefix = draftPrefixRef.current
        const next = prefix
          ? spoken
            ? `${prefix}${prefix.endsWith(' ') ? '' : ' '}${spoken}`
            : prefix
          : spoken
        handlers.onTextDraft(next)
        return
      }

      const messageId = conversationMessageIdRef.current
      if (messageId) handlers.onConversationLive(spoken)
    },
    [handlers]
  )

  const browser = useBrowserSpeechVoiceInput({
    enabled: useBrowser,
    onLiveTranscript
  })

  const whisper = useWhisperVoiceInput({ enabled: useWhisper })

  const backend = useBrowser ? 'browser' : useWhisper ? 'whisper' : ('none' as const)

  const start = useCallback(async () => {
    if (handlers.mode === 'text') {
      // draftPrefixRef set via setDraftPrefix() from MainPage
    } else {
      conversationMessageIdRef.current = handlers.onConversationStart()
    }

    if (useBrowser) return browser.start()
    if (useWhisper) return whisper.start()
    return false
  }, [backend, browser, handlers, useBrowser, useWhisper, whisper])

  const stop = useCallback(async (): Promise<string | null> => {
    if (useBrowser) {
      const text = (await browser.stop())?.trim() ?? ''
      if (handlers.mode === 'text') {
        draftPrefixRef.current = ''
        return text || null
      }
      const messageId = conversationMessageIdRef.current
      conversationMessageIdRef.current = ''
      if (messageId) await handlers.onConversationCommit(messageId)
      return text || null
    }

    if (useWhisper) {
      const text = (await whisper.stop())?.trim() ?? null
      if (!text) return null

      if (handlers.mode === 'text') {
        const prefix = draftPrefixRef.current
        draftPrefixRef.current = ''
        handlers.onTextDraft(prefix ? `${prefix} ${text}`.trim() : text)
        return text
      }

      const messageId = conversationMessageIdRef.current
      if (messageId) {
        handlers.onConversationLive(text)
        conversationMessageIdRef.current = ''
        await handlers.onConversationCommit(messageId)
      }
      return text
    }

    return null
  }, [browser, handlers, useBrowser, useWhisper, whisper])

  const cancel = useCallback(async () => {
    if (handlers.mode === 'text') {
      if (draftPrefixRef.current) handlers.onTextDraft(draftPrefixRef.current)
      draftPrefixRef.current = ''
    } else {
      const messageId = conversationMessageIdRef.current
      conversationMessageIdRef.current = ''
      if (messageId) handlers.onConversationCancel(messageId)
    }

    if (useBrowser) await browser.cancel()
    else if (useWhisper) whisper.cancel()
  }, [browser, handlers, useBrowser, useWhisper, whisper])

  const active = useBrowser ? browser : whisper

  return {
    supported: active.supported,
    backend,
    isLive: useBrowser && active.isRecording,
    phase: active.phase,
    isRecording: active.isRecording,
    isTranscribing: active.isTranscribing,
    isBusy: active.isBusy,
    interimTranscript: active.interimTranscript,
    start,
    stop,
    cancel,
    setDraftPrefix: (prefix: string) => {
      draftPrefixRef.current = prefix
    }
  }
}
