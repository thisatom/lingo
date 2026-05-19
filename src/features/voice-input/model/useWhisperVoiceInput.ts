import { useCallback, useEffect, useRef, useState } from 'react'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import {
  mapSpeechError,
  mapTranscriptionError
} from '@/features/speech-to-text/lib/speech-errors'
import { ensureWavForLocalStt } from '@/features/speech-to-text/lib/ensure-wav-for-stt'
import {
  isAudioCaptureSupported,
  startAudioCapture,
  type AudioCaptureSession
} from '@/features/voice-input/lib/record-session'
import { getLingo } from '@/shared/lib/lingo'
import { acquireMicrophoneStream, releaseMicrophoneStream } from '@/shared/lib/microphone'

const STT_TIMEOUT_MS = 120_000
const MAX_RECORDING_MS = 120_000

interface Options {
  enabled: boolean
}

type Phase = 'idle' | 'starting' | 'recording' | 'transcribing'

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms)
    promise
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        window.clearTimeout(timer)
        reject(err)
      })
  })
}

export function useRecordedVoiceInput({ enabled }: Options) {
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const setStage = useConversationStore((s) => s.setStage)
  const setSpeechError = useConversationStore((s) => s.setSpeechError)

  const supported = enabled && isAudioCaptureSupported() && Boolean(window.lingo?.stt)

  const streamRef = useRef<MediaStream | null>(null)
  const captureRef = useRef<AudioCaptureSession | null>(null)
  const phaseRef = useRef<Phase>('idle')
  const stopRequestedRef = useRef(false)
  const startTaskRef = useRef<Promise<boolean> | null>(null)

  const [phase, setPhase] = useState<Phase>('idle')
  const [monitorStream, setMonitorStream] = useState<MediaStream | null>(null)

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

  const releaseMic = useCallback(() => {
    releaseMicrophoneStream(streamRef.current)
    streamRef.current = null
    setMonitorStream(null)
  }, [])

  const hardReset = useCallback(() => {
    stopRequestedRef.current = false
    captureRef.current?.abort()
    captureRef.current = null
    releaseMic()
    setPhaseSafe('idle')
  }, [releaseMic, setPhaseSafe])

  useEffect(() => {
    if (!enabled) return
    return () => hardReset()
  }, [enabled, hardReset])

  const reportError = useCallback(
    (code: string) => {
      const message = mapSpeechError(code) ?? mapTranscriptionError(code)
      if (message) setSpeechError(message)
    },
    [setSpeechError]
  )

  const finishCapture = useCallback(async (): Promise<string | null> => {
    if (phaseRef.current === 'transcribing' || phaseRef.current === 'idle') {
      return null
    }

    const capture = captureRef.current
    captureRef.current = null

    if (!capture) {
      hardReset()
      return null
    }

    setPhaseSafe('transcribing')

    let audio: { audioBase64: string; format: string } | null = null
    try {
      audio = await capture.stop()
    } catch {
      audio = null
    }

    releaseMic()

    if (!audio) {
      hardReset()
      reportError('RECORDING_TOO_SHORT')
      return null
    }

    try {
      const wavAudio = await ensureWavForLocalStt(audio.audioBase64, audio.format)
      const { text } = await withTimeout(
        getLingo().stt.transcribe({
          audioBase64: wavAudio.audioBase64,
          format: wavAudio.format,
          language: practiceLanguage
        }),
        STT_TIMEOUT_MS,
        'STT_TIMEOUT'
      )
      const trimmed = text.trim()
      hardReset()
      if (!trimmed) {
        reportError('no-speech')
        return null
      }
      return trimmed
    } catch (error) {
      hardReset()
      const msg = error instanceof Error ? error.message : 'STT_FAILED'
      if (msg.includes('RECORDING_TOO_SHORT')) reportError('RECORDING_TOO_SHORT')
      else if (msg.includes('NO_SPEECH')) reportError('no-speech')
      else if (msg.includes('STT_TIMEOUT')) reportError('network')
      else reportError(msg)
      return null
    }
  }, [hardReset, practiceLanguage, releaseMic, reportError, setPhaseSafe])

  const start = useCallback(async (): Promise<boolean> => {
    if (!enabled || !supported) {
      reportError('SPEECH_NOT_SUPPORTED')
      return false
    }
    if (phaseRef.current !== 'idle') return false

    stopRequestedRef.current = false
    setSpeechError(null)
    setPhaseSafe('starting')

    const task = (async (): Promise<boolean> => {
      const { microphoneDeviceId, microphoneLabel } = useSettingsStore.getState()
      const stream = await acquireMicrophoneStream(microphoneDeviceId, microphoneLabel)

      if (stopRequestedRef.current || phaseRef.current === 'idle') {
        releaseMicrophoneStream(stream)
        hardReset()
        return false
      }

      if (!stream) {
        hardReset()
        reportError('not-allowed')
        return false
      }
      streamRef.current = stream
      setMonitorStream(stream)

      const capture = await startAudioCapture(stream, { preferWav: true })
      if (stopRequestedRef.current) {
        capture?.abort()
        hardReset()
        return false
      }

      if (!capture) {
        hardReset()
        reportError('RECORDING_EMPTY')
        return false
      }

      captureRef.current = capture
      setPhaseSafe('recording')

      if (stopRequestedRef.current) {
        return (await finishCapture()) !== null
      }
      return true
    })()

    startTaskRef.current = task
    try {
      return await task
    } finally {
      startTaskRef.current = null
    }
  }, [enabled, finishCapture, hardReset, reportError, setPhaseSafe, setSpeechError, supported])

  const stop = useCallback(async (): Promise<string | null> => {
    stopRequestedRef.current = true

    if (phaseRef.current === 'idle') return null

    if (phaseRef.current === 'starting') {
      if (startTaskRef.current) {
        await startTaskRef.current.catch(() => false)
      }
      if (captureRef.current) {
        return finishCapture()
      }
      hardReset()
      return null
    }

    if (phaseRef.current === 'recording') {
      return finishCapture()
    }

    return null
  }, [finishCapture, hardReset])

  useEffect(() => {
    if (phase !== 'recording') return
    const timer = window.setTimeout(() => {
      if (phaseRef.current === 'recording') {
        stopRequestedRef.current = true
        void finishCapture()
      }
    }, MAX_RECORDING_MS)
    return () => window.clearTimeout(timer)
  }, [phase, finishCapture])

  const cancel = useCallback(() => {
    stopRequestedRef.current = true
    captureRef.current?.abort()
    captureRef.current = null
    hardReset()
  }, [hardReset])

  const isRecording = phase === 'recording' || phase === 'starting'
  const isTranscribing = phase === 'transcribing'

  return {
    supported,
    phase,
    isRecording,
    isTranscribing,
    isBusy: phase !== 'idle',
    interimTranscript: '',
    monitorStream,
    start,
    stop,
    cancel
  }
}
