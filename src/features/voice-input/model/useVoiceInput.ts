import type { LiveVoiceHandlers } from '@/features/voice-input/model/useLiveVoiceInput'
import { useLiveVoiceInput } from '@/features/voice-input/model/useLiveVoiceInput'
import { isAudioCaptureSupported } from '@/features/voice-input/lib/record-session'
import { isLingoAvailable } from '@/shared/lib/lingo'
import SpeechRecognition from 'react-speech-recognition'

export type { VoiceInputPhase } from '@/features/voice-input/model/useLiveVoiceInput'

export function useVoiceInput(handlers: LiveVoiceHandlers) {
  return useLiveVoiceInput(handlers)
}

export function useVoiceInputBackend(): 'browser' | 'whisper' | 'none' {
  const browser =
    typeof window !== 'undefined' && SpeechRecognition.browserSupportsSpeechRecognition()
  if (browser) return 'browser'
  if (isLingoAvailable() && isAudioCaptureSupported()) return 'whisper'
  return 'none'
}
