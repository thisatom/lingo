import { BrowserWindow, ipcMain } from 'electron'
import type {
  ChatCompleteRequest,
  ChatStreamRequest,
  ResolvedTheme,
  SecretProviderId,
  SttTranscribeRequest,
  TtsSynthesizeRequest
} from '../../src/shared/types/ipc'
import { completeChat, validateOpenRouterKey } from './chat'
import { streamChat } from './chat-stream'
import { abortStream, clearStream, registerStreamAbort } from './chat-stream-registry'
import { clearSecret, getSecret, getSecretStatus, setSecret } from './secrets'
import { fetchLinkPreview } from './link-preview'
import { transcribeAudio } from './stt'
import { synthesizeSpeech } from './tts'
import { applyWindowTheme } from './window-theme'
import {
  checkForAppUpdate,
  consumePendingUpdateNotice,
  downloadAndInstallUpdate,
  getCurrentAppVersion,
  openReleasesPage
} from './app-update'

export function registerIpcHandlers(): void {
  ipcMain.handle('lingo:secrets:getStatus', (_e, provider: SecretProviderId) => {
    return getSecretStatus(provider)
  })
  ipcMain.handle('lingo:secrets:get', (_e, provider: SecretProviderId) => {
    return getSecret(provider)
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

  ipcMain.on('lingo:theme:apply', (event, resolved: ResolvedTheme) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win || (resolved !== 'light' && resolved !== 'dark')) return
    applyWindowTheme(win, resolved)
  })

  ipcMain.on('lingo:window:setTitle', (event, title: unknown) => {
    if (typeof title !== 'string') return
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    win.setTitle(title)
  })

  ipcMain.handle('lingo:updater:getVersion', () => getCurrentAppVersion())

  ipcMain.handle('lingo:updater:check', () => checkForAppUpdate())

  ipcMain.handle('lingo:updater:downloadAndInstall', () => downloadAndInstallUpdate())

  ipcMain.handle('lingo:updater:openReleasesPage', () => openReleasesPage())

  ipcMain.handle('lingo:updater:consumePendingNotice', () => consumePendingUpdateNotice())
}
