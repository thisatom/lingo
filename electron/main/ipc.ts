import { ipcMain } from 'electron'
import type {
  ChatCompleteRequest,
  SecretProviderId,
  TtsSynthesizeRequest
} from '../../src/shared/types/ipc'
import { completeChat, validateOpenRouterKey } from './chat'
import { clearSecret, getSecretStatus, setSecret } from './secrets'
import { synthesizeSpeech } from './tts'

export function registerIpcHandlers(): void {
  ipcMain.handle('lingo:secrets:getStatus', (_e, provider: SecretProviderId) => {
    return getSecretStatus(provider)
  })

  ipcMain.handle('lingo:secrets:set', (_e, provider: SecretProviderId, value: string) => {
    return setSecret(provider, value)
  })

  ipcMain.handle('lingo:secrets:clear', (_e, provider: SecretProviderId) => {
    return clearSecret(provider)
  })

  ipcMain.handle('lingo:secrets:validateOpenRouter', () => validateOpenRouterKey())

  ipcMain.handle('lingo:chat:complete', (_e, request: ChatCompleteRequest) => {
    return completeChat(request)
  })

  ipcMain.handle('lingo:tts:synthesize', (_e, request: TtsSynthesizeRequest) => {
    return synthesizeSpeech(request)
  })
}
