import { isAudioCaptureSupported } from '@/features/voice-input/lib/record-session'
import { isLingoAvailable } from '@/shared/lib/lingo'
import SpeechRecognition from 'react-speech-recognition'

export type SttBackend = 'local' | 'browser' | 'none'

/**
 * Desktop: record + free local Whisper (Transformers.js in main process).
 * Browser-only build: Web Speech API (free, live captions).
 */
export function selectSttBackend(): SttBackend {
  if (isLingoAvailable() && isAudioCaptureSupported()) {
    return 'local'
  }

  if (
    typeof window !== 'undefined' &&
    SpeechRecognition.browserSupportsSpeechRecognition()
  ) {
    return 'browser'
  }

  return 'none'
}
