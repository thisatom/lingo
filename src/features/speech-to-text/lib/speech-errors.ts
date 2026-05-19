export const NO_SPEECH_MESSAGE = 'No speech detected. Try again.'

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access denied. Allow the mic in system settings.',
  'no-speech': NO_SPEECH_MESSAGE,
  network: 'Speech recognition needs a network connection.',
  'audio-capture': 'Could not access the microphone.',
  'service-not-allowed': 'Speech recognition is not allowed.',
  aborted: '',
  SPEECH_NOT_SUPPORTED: 'Speech recognition is not supported in this environment.'
}

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.lingo)
}

export function mapSpeechError(code: string): string | null {
  if (code === 'aborted') return null

  if (code === 'network' && isDesktopApp()) {
    return 'Speech recognition needs a network connection. Check your internet, or type your message.'
  }

  return ERROR_MESSAGES[code] ?? `Speech error: ${code}`
}
