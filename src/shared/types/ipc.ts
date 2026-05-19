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

export interface TtsSynthesizeRequest {
  text: string
  voice?: string
  locale?: string
}

export interface TtsSynthesizeResponse {
  audioBase64: string
  mimeType: string
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
  }
  tts: {
    synthesize: (request: TtsSynthesizeRequest) => Promise<TtsSynthesizeResponse>
  }
}

declare global {
  interface Window {
    lingo: LingoApi
  }
}

export {}
