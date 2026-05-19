import { ipcMain } from 'electron'
import type {
  ChatCompleteRequest,
  ChatStreamRequest,
  SecretProviderId,
  SttTranscribeRequest,
  TtsSynthesizeRequest
} from '../../src/shared/types/ipc'
import { completeChat, validateOpenRouterKey } from './chat'
import { streamChat } from './chat-stream'
import { abortStream, clearStream, registerStreamAbort } from './chat-stream-registry'
import { clearSecret, getSecretStatus, setSecret } from './secrets'
import { fetchLinkPreview } from './link-preview'
import { transcribeAudio } from './stt'
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

  ipcMain.handle(
    'lingo:chat:stream',
    async (event, channel: string, request: ChatStreamRequest) => {
      const signal = registerStreamAbort(channel)
      try {
        await streamChat(request, (streamEvent) => {
          if (!event.sender.isDestroyed()) {
            event.sender.send(channel, streamEvent)
          }
        }, signal)
      } catch (error) {
        const isAbort =
          error instanceof Error &&
          (error.name === 'AbortError' || error.message.includes('aborted'))
        if (!isAbort && !event.sender.isDestroyed()) {
          const message = error instanceof Error ? error.message : 'Stream failed'
          event.sender.send(channel, { type: 'error', message })
          console.warn('[lingo:chat:stream]', message)
        }
      } finally {
        clearStream(channel)
      }
    }
  )

  ipcMain.on('lingo:chat:streamAbort', (_e, channel: string) => {
    abortStream(channel)
  })

  ipcMain.handle('lingo:stt:transcribe', (_e, request: SttTranscribeRequest) =>
    transcribeAudio(request)
  )

  ipcMain.handle('lingo:tts:synthesize', (_e, request: TtsSynthesizeRequest) => {
    return synthesizeSpeech(request)
  })

  ipcMain.handle('lingo:link:preview', (_e, url: string) => fetchLinkPreview(url))
}
