import { contextBridge, ipcRenderer } from 'electron'
import type {
  ChatCompleteRequest,
  LingoApi,
  SecretProviderId,
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
      ipcRenderer.invoke('lingo:chat:complete', request)
  },
  tts: {
    synthesize: (request: TtsSynthesizeRequest) =>
      ipcRenderer.invoke('lingo:tts:synthesize', request)
  }
}

contextBridge.exposeInMainWorld('lingo', lingo)

window.addEventListener('DOMContentLoaded', () => {
  void initCustomTitlebar().catch((error: unknown) => {
    console.error('[lingo preload] Titlebar failed:', error)
  })
})
