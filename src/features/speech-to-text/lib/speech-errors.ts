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
  NO_OPENROUTER_KEY: 'Add your OpenRouter API key in Settings to use voice input.'
}

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.lingo)
}

export function mapSpeechError(code: string): string | null {
  if (code === 'aborted') return null

  if (code === 'network' && isDesktopApp()) {
    return 'Voice input needs a network connection. Check your internet, or type your message.'
  }

  return ERROR_MESSAGES[code] ?? null
}

export function mapTranscriptionError(message: string): string | null {
  if (mapSpeechError(message)) return mapSpeechError(message)
  if (message.includes('NO_OPENROUTER_KEY')) {
    return ERROR_MESSAGES.NO_OPENROUTER_KEY
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
  if (message.includes('402') || message.includes('credits')) {
    return 'OpenRouter credits are insufficient for voice transcription.'
  }
  if (message.length > 120) {
    return 'Voice transcription failed. Try again or type your message.'
  }
  return `Voice transcription failed: ${message}`
}
