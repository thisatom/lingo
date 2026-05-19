export type SecretProviderId = 'openrouter' | 'azure-speech'

export interface SecretStatus {
  provider: SecretProviderId
  isSet: boolean
  masked?: string
}

export interface ChatMessagePayload {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatCompleteRequest {
  messages: ChatMessagePayload[]
  model?: string
  practiceLanguage?: string
}

export interface ChatCompleteResponse {
  text: string
}

export interface ChatStreamRequest {
  messages: ChatMessagePayload[]
  model?: string
  practiceLanguage?: string
  /** Defaults to true — enables OpenRouter `openrouter:web_search` server tool. */
  webSearch?: boolean
}

export type ChatStreamEvent =
  | { type: 'searching' }
  | { type: 'text-delta'; delta: string; text: string }
  | { type: 'done'; text: string }
  | { type: 'error'; message: string }

export interface ChatStreamHandlers {
  onSearching?: () => void
  onTextDelta?: (event: Extract<ChatStreamEvent, { type: 'text-delta' }>) => void
  onDone?: (event: Extract<ChatStreamEvent, { type: 'done' }>) => void
  onError?: (event: Extract<ChatStreamEvent, { type: 'error' }>) => void
}

export interface ChatStreamController {
  abort: () => void
  done: Promise<void>
}

export interface SttTranscribeRequest {
  audioBase64: string
  format: string
  language?: string
  model?: string
}

export interface SttTranscribeResponse {
  text: string
}

export interface TtsSynthesizeRequest {
  text: string
  voice?: string
  locale?: string
}

export interface TtsSynthesizeResponse {
  audioBase64: string
  mimeType: string
}

export interface LinkPreviewResponse {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
}

export interface LingoApi {
  secrets: {
    getStatus: (provider: SecretProviderId) => Promise<SecretStatus>
    set: (provider: SecretProviderId, value: string) => Promise<SecretStatus>
    clear: (provider: SecretProviderId) => Promise<SecretStatus>
    validateOpenRouter: () => Promise<{ ok: boolean; error?: string }>
  }
  chat: {
    complete: (request: ChatCompleteRequest) => Promise<ChatCompleteResponse>
    stream: (
      request: ChatStreamRequest,
      handlers: ChatStreamHandlers
    ) => ChatStreamController
  }
  stt: {
    transcribe: (request: SttTranscribeRequest) => Promise<SttTranscribeResponse>
  }
  tts: {
    synthesize: (request: TtsSynthesizeRequest) => Promise<TtsSynthesizeResponse>
  }
  link: {
    preview: (url: string) => Promise<LinkPreviewResponse>
  }
}

declare global {
  interface Window {
    lingo: LingoApi
  }
}

export {}
