export type SecretProviderId =
  | 'openrouter'
  | 'custom-llm'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'groq'
  | 'azure-speech'

export type LlmBackend = 'openrouter' | 'custom'

export interface CustomLlmConfig {
  baseUrl: string
  model: string
  /** Extra fields merged into chat/completions JSON (thinking, reasoning_effort, …). */
  completionExtras?: Record<string, unknown>
}

export interface SecretStatus {
  provider: SecretProviderId
  isSet: boolean
  masked?: string
}

export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export interface ChatMessagePayload {
  role: 'user' | 'assistant' | 'system'
  content: string | ChatContentPart[]
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
  /** Defaults to openrouter when omitted. */
  llmBackend?: LlmBackend
  /** Required when `llmBackend` is `custom`. */
  customLlm?: CustomLlmConfig
  /** Defaults to true — enables OpenRouter `openrouter:web_search` server tool. */
  webSearch?: boolean
  /** Try other free models when the selected one errors (no repeat attempts). */
  modelAutoFallback?: boolean
  /** Max completion tokens for this request (from Settings → API). */
  maxTokens?: number
  /** Retry budget when the first answer looks truncated (defaults to ~1.5× maxTokens). */
  maxTokensRetry?: number
}

export type ChatStreamEvent =
  | { type: 'searching' }
  | { type: 'status'; label: string }
  | { type: 'text-delta'; delta: string; text: string }
  | { type: 'done'; text: string }
  | { type: 'error'; message: string }

export interface ChatStreamHandlers {
  onSearching?: () => void
  onStatus?: (event: Extract<ChatStreamEvent, { type: 'status' }>) => void
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
  /** Edge TTS rate string, e.g. "+8%". */
  rate?: string
}

export interface TtsSynthesizeResponse {
  audioBase64: string
  mimeType: string
}

import type { ResolvedTheme } from './app-theme'

export type { ResolvedTheme } from './app-theme'

export interface LinkPreviewResponse {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
}

export interface AppUpdateInfo {
  version: string
  tag: string
  name: string
  body: string
  htmlUrl: string
  publishedAt: string
  downloadUrl: string | null
  downloadName: string | null
  downloadSize: number | null
}

export interface AppUpdateCheckResult {
  currentVersion: string
  update: AppUpdateInfo | null
  error: string | null
}

export interface PendingUpdateNotice {
  version: string
  body: string
  name?: string
}

export type LingoPlatform = 'electron' | 'web'

export interface LingoApi {
  platform: LingoPlatform
  secrets: {
    getStatus: (provider: SecretProviderId) => Promise<SecretStatus>
    /** Full stored key (settings reveal). Prefer over legacy `get`. */
    readKey: (provider: SecretProviderId) => Promise<string | null>
    /** @deprecated Use readKey — kept for older preload bundles */
    get?: (provider: SecretProviderId) => Promise<string | null>
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
  theme: {
    apply: (resolved: ResolvedTheme) => void
  }
  window: {
    setTitle: (title: string) => void
  }
  shortcuts: {
    onNewChat: (handler: () => void) => () => void
  }
  updater: {
    getCurrentVersion: () => Promise<string>
    check: () => Promise<AppUpdateCheckResult>
    downloadAndInstall: () => Promise<{ ok: boolean; error?: string }>
    openReleasesPage: () => Promise<void>
    consumePendingNotice: () => Promise<PendingUpdateNotice | null>
    onUpdateAvailable: (handler: (info: AppUpdateInfo) => void) => () => void
  }
  app?: {
    onPrepareShutdown: (handler: () => void | Promise<void>) => () => void
    notifyShutdownComplete: () => void
  }
}

declare global {
  interface Window {
    lingo: LingoApi
  }
}

export {}
