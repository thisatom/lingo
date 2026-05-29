import { useCallback, useRef } from 'react'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import { selectSttBackend } from '@/features/voice-input/lib/select-stt-backend'
import { mergePrefixAndSpoken } from '@/shared/lib/voice-draft-merge'
import { useBrowserSpeechVoiceInput } from '@/features/voice-input/model/useBrowserSpeechVoiceInput'
import { useRecordedVoiceInput } from '@/features/voice-input/model/useRecordedVoiceInput'

export type VoiceInputPhase = 'idle' | 'recording' | 'transcribing'

export interface LiveVoiceHandlers {
  mode: ChatComposerMode
  /** When true, transcript updates the open edit field — never a new chat message. */
  isEditSpeech?: () => boolean
  onTextDraft: (text: string) => void
  onConversationLive: (text: string) => void
  onConversationStart: () => string | null
  onConversationCommit: (messageId: string) => Promise<void>
  onConversationCancel: (messageId: string) => void
}

export function useLiveVoiceInput(handlers: LiveVoiceHandlers) {
  const draftPrefixRef = useRef('')
  const conversationMessageIdRef = useRef('')

  const backend = selectSttBackend()
  const useLocal = backend === 'local'
  const useBrowser = backend === 'browser'

  const applyTextDraft = useCallback(
    (spoken: string) => {
      const next = mergePrefixAndSpoken(draftPrefixRef.current, spoken)
      handlers.onTextDraft(next)
      return next
    },
    [handlers]
  )

  const onLiveTranscript = useCallback(
    (spoken: string) => {
      const useTextDraft = handlers.mode === 'text' || handlers.isEditSpeech?.()

      if (useTextDraft) {
        applyTextDraft(spoken)
        return
      }

      const messageId = conversationMessageIdRef.current
      if (messageId) handlers.onConversationLive(spoken)
    },
    [applyTextDraft, handlers]
  )

  const browser = useBrowserSpeechVoiceInput({
    enabled: useBrowser,
    onLiveTranscript
  })

  const recorded = useRecordedVoiceInput({ enabled: useLocal })

  const start = useCallback(async () => {
    if (handlers.mode === 'conversation') {
      const messageId = handlers.onConversationStart()
      if (!messageId) return false
      conversationMessageIdRef.current = messageId
    }

    if (useBrowser) return browser.start()
    if (useLocal) return recorded.start()
    return false
  }, [browser, handlers, recorded, useBrowser, useLocal])

  const stop = useCallback(async (): Promise<string | null> => {
    if (useBrowser) {
      const text = (await browser.stop())?.trim() ?? ''
      if (handlers.mode === 'text' || handlers.isEditSpeech?.()) {
        const final = text ? applyTextDraft(text) : draftPrefixRef.current
        draftPrefixRef.current = ''
        return final.trim() || null
      }
      const messageId = conversationMessageIdRef.current
      conversationMessageIdRef.current = ''
      if (messageId) await handlers.onConversationCommit(messageId)
      return text || null
    }

    if (useLocal) {
      const text = (await recorded.stop())?.trim() ?? null
      if (!text) return null

      if (handlers.mode === 'text' || handlers.isEditSpeech?.()) {
        const final = applyTextDraft(text)
        draftPrefixRef.current = ''
        return final.trim() || null
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
  }, [applyTextDraft, browser, handlers, recorded, useBrowser, useLocal])

  const cancel = useCallback(async () => {
    if (handlers.mode === 'text' || handlers.isEditSpeech?.()) {
      if (draftPrefixRef.current) handlers.onTextDraft(draftPrefixRef.current)
      draftPrefixRef.current = ''
    } else {
      const messageId = conversationMessageIdRef.current
      conversationMessageIdRef.current = ''
      if (messageId) handlers.onConversationCancel(messageId)
    }

    if (useBrowser) await browser.cancel()
    else if (useLocal) recorded.cancel()
  }, [applyTextDraft, browser, handlers, recorded, useBrowser, useLocal])

  const active = useLocal ? recorded : browser

  return {
    supported: active.supported,
    backend,
    isLive: useBrowser && active.isRecording,
    phase: active.phase,
    isRecording: active.isRecording,
    isTranscribing: active.isTranscribing,
    isBusy: active.isBusy,
    interimTranscript: useBrowser ? active.interimTranscript : '',
    monitorStream: useLocal ? recorded.monitorStream : null,
    start,
    stop,
    cancel,
    setDraftPrefix: (prefix: string) => {
      draftPrefixRef.current = prefix
    }
  }
}
