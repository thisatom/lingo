import { useCallback, useEffect, useRef, useState } from 'react'
import { useConversationStore } from '@/entities/conversation/model/store'
import { setActiveChatPipelineStage } from '@/features/ai-chat/lib/pipeline-stage'
import { useSettingsStore } from '@/entities/settings/model/store'
import {
  mapSpeechError,
  mapTranscriptionError
} from '@/features/speech-to-text/lib/speech-errors'
import {
  isMediaRecorderCaptureSupported,
  startMediaRecorder,
  type RecorderSession
} from '@/features/speech-to-text/lib/media-recorder-capture'
import {
  isSpeechRecognitionSupported,
  startListening,
  type SpeechSession
} from '@/features/speech-to-text/lib/webSpeechRecognition'
import {
  isWavRecorderSupported,
  startWavRecorder,
  type WavRecorderSession
} from '@/features/speech-to-text/lib/wav-recorder'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import {
  acquireMicrophoneStream,
  releaseMicrophoneStream
} from '@/shared/lib/microphone'

export { NO_SPEECH_MESSAGE } from '@/features/speech-to-text/lib/speech-errors'

type AudioRecorderSession = RecorderSession | WavRecorderSession

function useRecordedStt(): boolean {
  return (
    isLingoAvailable() &&
    Boolean(window.lingo?.stt) &&
    (isWavRecorderSupported() || isMediaRecorderCaptureSupported())
  )
}

export function useVoiceCapture() {
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const microphoneDeviceId = useSettingsStore((s) => s.microphoneDeviceId)
  const setSpeechError = useConversationStore((s) => s.setSpeechError)

  const useWhisper = useRecordedStt()
  const webSpeechSupported = isSpeechRecognitionSupported()
  const supported = useWhisper || webSpeechSupported

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<AudioRecorderSession | null>(null)
  const webSessionRef = useRef<SpeechSession | null>(null)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const finalizeRef = useRef<((text: string) => void) | null>(null)
  const stoppingRef = useRef(false)

  const cleanup = useCallback(() => {
    stoppingRef.current = false
    recorderRef.current?.abort()
    recorderRef.current = null
    webSessionRef.current?.abort()
    webSessionRef.current = null
    releaseMicrophoneStream(streamRef.current)
    streamRef.current = null
    setIsListening(false)
    setInterimTranscript('')
    finalizeRef.current = null
  }, [])

  useEffect(() => cleanup, [cleanup])

  const reportSpeechError = useCallback(
    (code: string) => {
      const message = mapSpeechError(code) ?? mapTranscriptionError(code)
      if (message) setSpeechError(message)
    },
    [setSpeechError]
  )

  const finishTranscript = useCallback(
    (text: string, onTranscript: (value: string) => void) => {
      setInterimTranscript('')
      setActiveChatPipelineStage('idle')
      cleanup()
      onTranscript(text.trim())
    },
    [cleanup]
  )

  const transcribeRecording = useCallback(
    async (onTranscript: (text: string) => void) => {
      const recorder = recorderRef.current
      recorderRef.current = null

      if (!recorder) {
        setActiveChatPipelineStage('idle')
        stoppingRef.current = false
        cleanup()
        reportSpeechError('RECORDING_EMPTY')
        return
      }

      setActiveChatPipelineStage('transcribing')

      let audio: { audioBase64: string; format: string } | null = null
      try {
        audio = await recorder.stop()
      } catch {
        audio = null
      }

      releaseMicrophoneStream(streamRef.current)
      streamRef.current = null
      setIsListening(false)
      stoppingRef.current = false

      if (!audio) {
        setActiveChatPipelineStage('idle')
        reportSpeechError('RECORDING_TOO_SHORT')
        return
      }

      try {
        const { text } = await getLingo().stt.transcribe({
          audioBase64: audio.audioBase64,
          format: audio.format,
          language: practiceLanguage
        })
        if (!text.trim()) {
          reportSpeechError('no-speech')
          setActiveChatPipelineStage('idle')
          return
        }
        finishTranscript(text, onTranscript)
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'STT_FAILED'
        if (msg.includes('NO_OPENROUTER_KEY')) {
          reportSpeechError('NO_OPENROUTER_KEY')
        } else if (msg.includes('RECORDING_TOO_SHORT')) {
          reportSpeechError('RECORDING_TOO_SHORT')
        } else if (msg.includes('NO_SPEECH')) {
          reportSpeechError('no-speech')
        } else {
          reportSpeechError(msg)
        }
        setActiveChatPipelineStage('idle')
        cleanup()
      }
    },
    [cleanup, finishTranscript, practiceLanguage, reportSpeechError]
  )

  const stopListening = useCallback(() => {
    if (!isListening || stoppingRef.current) return
    stoppingRef.current = true

    const onTranscript = finalizeRef.current
    if (useWhisper && recorderRef.current && onTranscript) {
      void transcribeRecording(onTranscript)
      return
    }

    stoppingRef.current = false

    if (webSessionRef.current) {
      setActiveChatPipelineStage('transcribing')
      webSessionRef.current.stop()
      webSessionRef.current = null
      setIsListening(false)
    }
  }, [isListening, transcribeRecording, useWhisper])

  const startListeningSession = useCallback(
    async (onTranscript: (text: string) => void): Promise<boolean> => {
      if (!supported) {
        reportSpeechError('SPEECH_NOT_SUPPORTED')
        return false
      }

      if (useWhisper && !window.lingo?.stt) {
        reportSpeechError('SPEECH_NOT_SUPPORTED')
        return false
      }

      setSpeechError(null)
      setInterimTranscript('')
      finalizeRef.current = onTranscript
      stoppingRef.current = false

      const stream = await acquireMicrophoneStream(microphoneDeviceId)
      if (!stream) {
        reportSpeechError('not-allowed')
        return false
      }
      streamRef.current = stream

      if (useWhisper) {
        const recorder = (await startWavRecorder(stream)) ?? startMediaRecorder(stream)
        if (!recorder) {
          cleanup()
          reportSpeechError('RECORDING_EMPTY')
          return false
        }
        recorderRef.current = recorder
        setIsListening(true)
        setActiveChatPipelineStage('listening')
        return true
      }

      const session = startListening({
        language: practiceLanguage,
        onInterim: (text) => setInterimTranscript(text),
        onFinal: (text) => {
          const trimmed = text.trim()
          if (!trimmed) {
            reportSpeechError('no-speech')
            setActiveChatPipelineStage('idle')
            cleanup()
            return
          }
          finishTranscript(text, onTranscript)
        },
        onError: (code) => {
          cleanup()
          setActiveChatPipelineStage('idle')
          reportSpeechError(code)
        }
      })

      if (!session) {
        cleanup()
        reportSpeechError('not-allowed')
        return false
      }

      webSessionRef.current = session
      setIsListening(true)
      setActiveChatPipelineStage('listening')
      return true
    },
    [
      cleanup,
      finishTranscript,
      microphoneDeviceId,
      practiceLanguage,
      reportSpeechError,
      setSpeechError,
      supported,
      useWhisper
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
    startListeningSession,
    stopListening,
    toggleListening,
    usesWhisperStt: useWhisper
  }
}
