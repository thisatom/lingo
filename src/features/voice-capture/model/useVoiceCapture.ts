import { useCallback, useEffect, useRef, useState } from 'react'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import {
  mapSpeechError,
  NO_SPEECH_MESSAGE
} from '@/features/speech-to-text/lib/speech-errors'
import {
  isSpeechRecognitionSupported,
  startListening,
  type SpeechSession
} from '@/features/speech-to-text/lib/webSpeechRecognition'
import {
  acquireMicrophoneStream,
  releaseMicrophoneStream
} from '@/shared/lib/microphone'

export { NO_SPEECH_MESSAGE } from '@/features/speech-to-text/lib/speech-errors'

export function useVoiceCapture() {
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const microphoneDeviceId = useSettingsStore((s) => s.microphoneDeviceId)
  const stage = useConversationStore((s) => s.stage)
  const setStage = useConversationStore((s) => s.setStage)
  const setError = useConversationStore((s) => s.setError)

  const sessionRef = useRef<SpeechSession | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const finalizeRef = useRef<((text: string) => void) | null>(null)

  const supported = isSpeechRecognitionSupported()

  const cleanup = useCallback(() => {
    sessionRef.current?.abort()
    sessionRef.current = null
    releaseMicrophoneStream(streamRef.current)
    streamRef.current = null
    setIsListening(false)
    setInterimTranscript('')
    finalizeRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const reportSpeechError = useCallback(
    (code: string) => {
      const message = mapSpeechError(code)
      if (message) setError(message)
    },
    [setError]
  )

  const stopListening = useCallback(() => {
    if (!sessionRef.current) return
    setStage('transcribing')
    sessionRef.current.stop()
    sessionRef.current = null
    setIsListening(false)
  }, [setStage])

  const startListeningSession = useCallback(
    async (onTranscript: (text: string) => void): Promise<boolean> => {
      if (!supported) {
        reportSpeechError('SPEECH_NOT_SUPPORTED')
        return false
      }

      setError(null)
      setInterimTranscript('')
      finalizeRef.current = onTranscript

      const stream = await acquireMicrophoneStream(microphoneDeviceId)
      if (!stream) {
        reportSpeechError('not-allowed')
        return false
      }
      streamRef.current = stream

      const session = startListening({
        language: practiceLanguage,
        onInterim: (text) => setInterimTranscript(text),
        onFinal: (text) => {
          setInterimTranscript('')
          setStage('idle')
          cleanup()
          const trimmed = text.trim()
          if (!trimmed) {
            setError(NO_SPEECH_MESSAGE)
            return
          }
          onTranscript(trimmed)
        },
        onError: (code) => {
          cleanup()
          setStage('idle')
          reportSpeechError(code)
        }
      })

      if (!session) {
        cleanup()
        reportSpeechError('not-allowed')
        return false
      }

      sessionRef.current = session
      setIsListening(true)
      setStage('listening')
      return true
    },
    [
      cleanup,
      microphoneDeviceId,
      practiceLanguage,
      reportSpeechError,
      setError,
      setStage,
      supported
    ]
  )

  const toggleListening = useCallback(
    async (onTranscript: (text: string) => void) => {
      if (isListening) {
        stopListening()
        return
      }
      await startListeningSession(onTranscript)
    },
    [isListening, startListeningSession, stopListening]
  )

  return {
    supported,
    isListening,
    interimTranscript,
    stage,
    startListeningSession,
    stopListening,
    toggleListening
  }
}
