import { useCallback, useEffect, useRef, useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { mapSpeechError } from '@/features/speech-to-text/lib/speech-errors'
import {
  acquireMicrophoneStream,
  isSystemDefaultMicrophone,
  releaseMicrophoneStream
} from '@/shared/lib/microphone'
import { toSpeechLocale } from '@/shared/lib/speech-locale'

interface Options {
  enabled: boolean
  /** Fired while recording with interim + final text merged. */
  onLiveTranscript?: (text: string) => void
}

type Phase = 'idle' | 'starting' | 'recording' | 'transcribing'

export function useBrowserSpeechVoiceInput({ enabled, onLiveTranscript }: Options) {
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const setStage = useConversationStore((s) => s.setStage)
  const setSpeechError = useConversationStore((s) => s.setSpeechError)

  const {
    transcript,
    interimTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition({ transcribing: enabled, clearTranscriptOnListen: true })

  const supported =
    enabled &&
    browserSupportsSpeechRecognition &&
    isMicrophoneAvailable !== false

  const phaseRef = useRef<Phase>('idle')
  const transcriptRef = useRef('')
  const stopRequestedRef = useRef(false)
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    transcriptRef.current = transcript.trim()
  }, [transcript])

  useEffect(() => {
    if (!enabled || !onLiveTranscript) return
    if (phaseRef.current !== 'recording' && phaseRef.current !== 'starting') return
    const spoken = [transcript, interimTranscript].filter(Boolean).join(' ').trim()
    onLiveTranscript(spoken)
  }, [enabled, interimTranscript, onLiveTranscript, transcript])

  const clearVoiceStage = useCallback(() => {
    const current = useConversationStore.getState().stage
    if (current === 'listening' || current === 'transcribing') {
      setStage('idle')
    }
  }, [setStage])

  const setPhaseSafe = useCallback(
    (next: Phase) => {
      phaseRef.current = next
      setPhase(next)
      if (next === 'starting' || next === 'recording') {
        setStage('listening')
        return
      }
      if (next === 'transcribing') {
        setStage('transcribing')
        return
      }
      clearVoiceStage()
    },
    [clearVoiceStage, setStage]
  )

  const hardReset = useCallback(() => {
    stopRequestedRef.current = false
    setPhaseSafe('idle')
  }, [setPhaseSafe])

  const reportError = useCallback(
    (code: string) => {
      const message = mapSpeechError(code)
      if (message) setSpeechError(message)
    },
    [setSpeechError]
  )

  const primeMicrophone = useCallback(async (): Promise<boolean> => {
    const { microphoneDeviceId, microphoneLabel } = useSettingsStore.getState()
    if (isSystemDefaultMicrophone(microphoneDeviceId) && !microphoneLabel) {
      return true
    }
    const stream = await acquireMicrophoneStream(microphoneDeviceId, microphoneLabel)
    if (!stream) return false
    releaseMicrophoneStream(stream)
    return true
  }, [])

  const finalizeTranscript = useCallback(async (): Promise<string | null> => {
    setPhaseSafe('transcribing')

    try {
      await SpeechRecognition.stopListening()
    } catch {
      // ignore
    }

    await new Promise((resolve) => window.setTimeout(resolve, 200))

    const text = transcriptRef.current
    resetTranscript()
    hardReset()

    if (!text) {
      reportError('no-speech')
      return null
    }
    return text
  }, [hardReset, reportError, resetTranscript, setPhaseSafe])

  const start = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false
    if (!supported) {
      reportError('SPEECH_NOT_SUPPORTED')
      return false
    }
    if (phaseRef.current !== 'idle') return false

    stopRequestedRef.current = false
    setSpeechError(null)
    resetTranscript()
    setPhaseSafe('starting')

    if (!(await primeMicrophone())) {
      hardReset()
      reportError('not-allowed')
      return false
    }

    if (stopRequestedRef.current) {
      hardReset()
      return false
    }

    try {
      await SpeechRecognition.startListening({
        continuous: true,
        language: toSpeechLocale(practiceLanguage)
      })
    } catch {
      hardReset()
      reportError('not-allowed')
      return false
    }

    const manager = SpeechRecognition.getRecognitionManager()
    if (!manager.listening) {
      hardReset()
      reportError('not-allowed')
      return false
    }

    setPhaseSafe('recording')

    if (stopRequestedRef.current) {
      return (await finalizeTranscript()) !== null
    }
    return true
  }, [
    enabled,
    finalizeTranscript,
    hardReset,
    practiceLanguage,
    primeMicrophone,
    reportError,
    resetTranscript,
    setPhaseSafe,
    setSpeechError,
    supported
  ])

  const stop = useCallback(async (): Promise<string | null> => {
    if (!enabled || phaseRef.current === 'idle') return null

    stopRequestedRef.current = true

    if (phaseRef.current === 'starting') {
      hardReset()
      try {
        await SpeechRecognition.abortListening()
      } catch {
        // ignore
      }
      resetTranscript()
      return null
    }

    return finalizeTranscript()
  }, [enabled, finalizeTranscript, hardReset, resetTranscript])

  const cancel = useCallback(async () => {
    if (!enabled || phaseRef.current === 'idle') return
    stopRequestedRef.current = true
    try {
      await SpeechRecognition.abortListening()
    } catch {
      // ignore
    }
    resetTranscript()
    hardReset()
  }, [enabled, hardReset, resetTranscript])

  useEffect(() => {
    if (!enabled) return
    return () => {
      void SpeechRecognition.abortListening()
      hardReset()
    }
  }, [enabled, hardReset])

  const isRecording =
    enabled && (phase === 'recording' || phase === 'starting' || listening)
  const isTranscribing = phase === 'transcribing'

  return {
    supported,
    phase,
    isRecording,
    isTranscribing,
    isBusy: enabled && phase !== 'idle',
    interimTranscript: isRecording ? interimTranscript || transcript : '',
    start,
    stop,
    cancel
  }
}
