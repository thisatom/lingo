declare module 'react-speech-recognition' {
  export interface StartListeningOptions {
    continuous?: boolean
    language?: string
  }

  export interface UseSpeechRecognitionOptions {
    transcribing?: boolean
    clearTranscriptOnListen?: boolean
    commands?: unknown[]
  }

  export interface UseSpeechRecognitionResult {
    transcript: string
    interimTranscript: string
    finalTranscript: string
    listening: boolean
    isMicrophoneAvailable: boolean
    resetTranscript: () => void
    browserSupportsSpeechRecognition: boolean
    browserSupportsContinuousListening: boolean
  }

  export function useSpeechRecognition(
    options?: UseSpeechRecognitionOptions
  ): UseSpeechRecognitionResult

  interface SpeechRecognitionManager {
    listening: boolean
  }

  const SpeechRecognition: {
    startListening: (options?: StartListeningOptions) => Promise<void>
    stopListening: () => Promise<void>
    abortListening: () => Promise<void>
    getRecognition: () => globalThis.SpeechRecognition | null
    getRecognitionManager: () => SpeechRecognitionManager
    browserSupportsSpeechRecognition: () => boolean
    browserSupportsContinuousListening: () => boolean
  }

  export default SpeechRecognition
}
