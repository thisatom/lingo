import { toSpeechLocale } from '@/shared/lib/speech-locale'

export function isSpeechRecognitionSupported(): boolean {
  return Boolean(getSpeechRecognitionCtor())
}

function getSpeechRecognitionCtor(): typeof SpeechRecognition | null {
  const w = window as Window & {
    SpeechRecognition?: typeof SpeechRecognition
    webkitSpeechRecognition?: typeof SpeechRecognition
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export interface SpeechSession {
  stop: () => void
  abort: () => void
}

export interface StartListeningOptions {
  language: string
  onInterim: (text: string) => void
  onFinal: (text: string) => void
  onError: (error: string) => void
}

export function startListening(options: StartListeningOptions): SpeechSession | null {
  const Ctor = getSpeechRecognitionCtor()
  if (!Ctor) return null

  const recognition = new Ctor()
  recognition.lang = toSpeechLocale(options.language)
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  let finalText = ''
  let lastInterim = ''
  let settled = false
  let lastErrorCode: string | null = null

  const settle = (run: () => void) => {
    if (settled) return
    settled = true
    run()
  }

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const transcript = result[0]?.transcript ?? ''
      if (result.isFinal) {
        finalText += transcript
      } else {
        interim += transcript
      }
    }
    lastInterim = interim
    const combined = (finalText + interim).trim()
    if (combined) options.onInterim(combined)
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === 'aborted') return
    lastErrorCode = event.error
    settle(() => options.onError(event.error))
  }

  recognition.onend = () => {
    settle(() => {
      if (lastErrorCode) return

      const text = (finalText + lastInterim).trim()
      if (text) options.onFinal(text)
      else options.onError('no-speech')
    })
  }

  try {
    recognition.start()
  } catch {
    options.onError('not-allowed')
    return null
  }

  return {
    stop: () => recognition.stop(),
    abort: () => {
      settled = true
      lastErrorCode = 'aborted'
      recognition.abort()
    }
  }
}
