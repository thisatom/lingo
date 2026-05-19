import { contextBridge, ipcRenderer } from 'electron'
import type {
  ChatCompleteRequest,
  ChatStreamEvent,
  ChatStreamHandlers,
  ChatStreamRequest,
  LingoApi,
  SecretProviderId,
  SttTranscribeRequest,
  TtsSynthesizeRequest
} from '../../src/shared/types/ipc'
import { initCustomTitlebar } from './titlebar'

const lingo: LingoApi = {
  secrets: {
    getStatus: (provider: SecretProviderId) =>
      ipcRenderer.invoke('lingo:secrets:getStatus', provider),
    set: (provider: SecretProviderId, value: string) =>
      ipcRenderer.invoke('lingo:secrets:set', provider, value),
    clear: (provider: SecretProviderId) =>
      ipcRenderer.invoke('lingo:secrets:clear', provider),
    validateOpenRouter: () => ipcRenderer.invoke('lingo:secrets:validateOpenRouter')
  },
  chat: {
    complete: (request: ChatCompleteRequest) =>
      ipcRenderer.invoke('lingo:chat:complete', request),
    stream: (request: ChatStreamRequest, handlers: ChatStreamHandlers) => {
      const channel = `lingo:chat:stream:${crypto.randomUUID()}`
      let streamError: Error | null = null

      const listener = (_event: unknown, payload: ChatStreamEvent) => {
        switch (payload.type) {
          case 'searching':
            handlers.onSearching?.()
            break
          case 'text-delta':
            handlers.onTextDelta?.(payload)
            break
          case 'done':
            handlers.onDone?.(payload)
            break
          case 'error':
            streamError = new Error(payload.message)
            handlers.onError?.(payload)
            break
        }
      }

      ipcRenderer.on(channel, listener)

      const done = ipcRenderer
        .invoke('lingo:chat:stream', channel, request)
        .then(() => {
          if (streamError) throw streamError
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Stream failed'
          if (message.includes('aborted')) return
          if (streamError) throw streamError
          const err = error instanceof Error ? error : new Error(message)
          handlers.onError?.({ type: 'error', message: err.message })
          throw err
        })
        .finally(() => {
          ipcRenderer.removeListener(channel, listener)
        })

      return {
        abort: () => {
          ipcRenderer.send('lingo:chat:streamAbort', channel)
        },
        done
      }
    }
  },
  stt: {
    transcribe: (request: SttTranscribeRequest) =>
      ipcRenderer.invoke('lingo:stt:transcribe', request)
  },
  tts: {
    synthesize: (request: TtsSynthesizeRequest) =>
      ipcRenderer.invoke('lingo:tts:synthesize', request)
  },
  link: {
    preview: (url: string) => ipcRenderer.invoke('lingo:link:preview', url)
  }
}

contextBridge.exposeInMainWorld('lingo', lingo)

window.addEventListener('DOMContentLoaded', () => {
  void initCustomTitlebar().catch((error: unknown) => {
    console.error('[lingo preload] Titlebar failed:', error)
  })
})
