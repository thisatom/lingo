export const NO_SPEECH_MESSAGE = 'No speech detected. Try again.'

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access denied. Allow the mic in system settings.',
  'no-speech': NO_SPEECH_MESSAGE,
  RECORDING_TOO_SHORT:
    'Hold the mic button longer (at least half a second) while speaking, then release.',
  RECORDING_EMPTY: 'Could not capture audio from the microphone. Check your mic in Settings.',
  network: 'Speech recognition needs a network connection.',
  'audio-capture': 'Could not access the microphone.',
  'service-not-allowed': 'Speech recognition is not allowed.',
  aborted: '',
  SPEECH_NOT_SUPPORTED: 'Voice input is not supported in this environment.',
  NO_OPENROUTER_KEY: 'Add your OpenRouter API key in Settings to use voice input.',
  LOCAL_STT_LOADING:
    'Loading speech model… The first run downloads ~40 MB; keep the app open.',
  LOCAL_STT_FAILED:
    'On-device transcription failed. Try again or type your message.',
  STT_MODEL_LOADING: 'Loading speech model… First run may download ~40 MB (one time, free).'
}

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.lingo)
}

export function mapSpeechError(code: string): string | null {
  if (code === 'aborted') return null

  if (code === 'network' && isDesktopApp()) {
    return ERROR_MESSAGES.LOCAL_STT_LOADING
  }

  return ERROR_MESSAGES[code] ?? null
}

export function mapTranscriptionError(message: string): string | null {
  if (mapSpeechError(message)) return mapSpeechError(message)
  if (message.includes('NO_OPENROUTER_KEY')) {
    return ERROR_MESSAGES.NO_OPENROUTER_KEY
  }
  if (message.includes('balance') || message.includes('$0.50')) {
    return 'Voice uses free on-device transcription. Restart the app if you still see this.'
  }
  if (message.includes('STT_TIMEOUT') || message.includes('Loading local Whisper')) {
    return ERROR_MESSAGES.LOCAL_STT_LOADING
  }
  if (message.includes('LOCAL_STT') || message.includes('INVALID_WAV')) {
    return ERROR_MESSAGES.LOCAL_STT_FAILED
  }
  if (message.includes('RECORDING_TOO_SHORT')) {
    return ERROR_MESSAGES.RECORDING_TOO_SHORT
  }
  if (message.includes('RECORDING_EMPTY')) {
    return ERROR_MESSAGES.RECORDING_EMPTY
  }
  if (message.includes('NO_SPEECH')) {
    return NO_SPEECH_MESSAGE
  }
  if (message.includes('402') || message.includes('credits') || message.includes('$0.50')) {
    return 'Cloud transcription requires paid balance. The app now uses free on-device speech recognition.'
  }
  if (message.includes('LOCAL_STT') || message.includes('transformers')) {
    return 'On-device transcription failed. Try again or check the terminal log.'
  }
  if (message.length > 120) {
    return 'Voice transcription failed. Try again or type your message.'
  }
  return `Voice transcription failed: ${message}`
}
