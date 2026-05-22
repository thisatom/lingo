import {
  clearAllWebSecrets,
  clearWebSecret,
  getWebSecret,
  getWebSecretStatus,
  setWebSecret,
  validateWebOpenRouterKey
} from '@/shared/api/web-secrets'
import { fetchWebLinkPreview } from '@/shared/api/web-link-preview'
import { transcribeWebAudio } from '@/shared/api/web-stt'
import { synthesizeWebSpeech } from '@/shared/api/web-tts'
import { openRouterConfig } from '@/shared/config/openrouter'
import { streamOpenRouterChat } from '@/shared/lib/openrouter-chat-stream'
import type {
  AppUpdateCheckResult,
  AppUpdateInfo,
  ChatStreamController,
  ChatStreamHandlers,
  ChatStreamRequest,
  LingoApi,
  PendingUpdateNotice,
  ResolvedTheme,
  SecretProviderId,
  SttTranscribeRequest,
  TtsSynthesizeRequest
} from '@/shared/types/ipc'

const WEB_VERSION =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_VERSION
    ? String(import.meta.env.VITE_APP_VERSION)
    : '0.0.0-web'

function createWebChatStream(
  request: ChatStreamRequest,
  handlers: ChatStreamHandlers
): ChatStreamController {
  const abortController = new AbortController()
  let streamError: Error | null = null

  const done = streamOpenRouterChat(
    request,
    (event) => {
      switch (event.type) {
        case 'searching':
          handlers.onSearching?.()
          break
        case 'text-delta':
          handlers.onTextDelta?.(event)
          break
        case 'done':
          handlers.onDone?.(event)
          break
        case 'error':
          streamError = new Error(event.message)
          handlers.onError?.(event)
          break
      }
    },
    () =>
      request.llmBackend === 'custom'
        ? getWebSecret('custom-llm')
        : getWebSecret('openrouter'),
    {
      defaultModel:
        typeof import.meta !== 'undefined' && import.meta.env?.VITE_LINGO_OPENROUTER_MODEL
          ? String(import.meta.env.VITE_LINGO_OPENROUTER_MODEL)
          : openRouterConfig.defaultModel
    },
    abortController.signal
  )
    .then(() => {
      if (streamError) throw streamError
    })
    .catch((error: unknown) => {
      if (abortController.signal.aborted) return
      if (streamError) throw streamError
      const message = error instanceof Error ? error.message : 'Stream failed'
      const err = error instanceof Error ? error : new Error(message)
      handlers.onError?.({ type: 'error', message: err.message })
      throw err
    })

  return {
    abort: () => abortController.abort(),
    done
  }
}

export function createBrowserLingoApi(): LingoApi {
  return {
    platform: 'web',
    secrets: {
      getStatus: (provider: SecretProviderId) => getWebSecretStatus(provider),
      readKey: (provider: SecretProviderId) => getWebSecret(provider),
      get: (provider: SecretProviderId) => getWebSecret(provider),
      set: (provider: SecretProviderId, value: string) => setWebSecret(provider, value),
      clear: (provider: SecretProviderId) => clearWebSecret(provider),
      validateOpenRouter: () => validateWebOpenRouterKey()
    },
    chat: {
      complete: async () => {
        throw new Error('Use chat.stream in the web app')
      },
      stream: createWebChatStream
    },
    stt: {
      transcribe: (request: SttTranscribeRequest) => transcribeWebAudio(request)
    },
    tts: {
      synthesize: (request: TtsSynthesizeRequest) => synthesizeWebSpeech(request)
    },
    link: {
      preview: (url: string) => fetchWebLinkPreview(url)
    },
    theme: {
      apply: (_resolved: ResolvedTheme) => {
        // Document theme is synced in useThemeSync / applyThemePreference.
      }
    },
    window: {
      setTitle: (title: string) => {
        document.title = title
      }
    },
    shortcuts: {
      onNewChat: () => () => {}
    },
    updater: {
      getCurrentVersion: async () => WEB_VERSION,
      check: async (): Promise<AppUpdateCheckResult> => ({
        currentVersion: WEB_VERSION,
        update: null,
        error: null
      }),
      downloadAndInstall: async () => ({
        ok: false,
        error: 'Updates are installed via the desktop app or by refreshing this page.'
      }),
      openReleasesPage: async () => {
        window.open('https://github.com/thisatom/lingo/releases', '_blank', 'noopener')
      },
      consumePendingNotice: async (): Promise<PendingUpdateNotice | null> => null,
      onUpdateAvailable: () => () => {}
    }
  }
}

export { clearAllWebSecrets }
