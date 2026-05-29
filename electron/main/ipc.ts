import { BrowserWindow, ipcMain } from 'electron'
import type { ResolvedTheme } from '../../src/shared/types/ipc'
import {
  IpcValidationError,
  parseChatCompleteRequest,
  parseChatStreamRequest,
  parseLinkPreviewUrl,
  parseSecretProviderId,
  parseSttTranscribeRequest,
  parseDroppedFilePaths,
  parseStreamChannel,
  parseTtsSynthesizeRequest
} from '../../src/shared/types/ipc-schemas'
import { readDroppedFilePaths } from './read-dropped-files'
import { completeChat, validateOpenRouterKey } from './chat'
import { streamChat } from './chat-stream'
import { abortStream, clearStream, registerStreamAbort } from './chat-stream-registry'
import { listOpenRouterModelsInMain } from './openrouter-models'
import { clearSecret, getSecretStatus, setSecret } from './secrets'
import { resolveAppIconPath } from './icon'
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

function rejectInvalidPayload(error: unknown): never {
  const message =
    error instanceof IpcValidationError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Invalid IPC payload'
  throw new Error(message)
}

export function registerIpcHandlers(): void {
  ipcMain.handle('lingo:secrets:getStatus', (_e, provider: unknown) => {
    try {
      return getSecretStatus(parseSecretProviderId(provider))
    } catch (error) {
      rejectInvalidPayload(error)
    }
  })
  ipcMain.handle('lingo:secrets:set', (_e, provider: unknown, value: unknown) => {
    try {
      if (typeof value !== 'string') {
        throw new IpcValidationError('secret value must be a string')
      }
      return setSecret(parseSecretProviderId(provider), value)
    } catch (error) {
      rejectInvalidPayload(error)
    }
  })

  ipcMain.handle('lingo:secrets:clear', (_e, provider: unknown) => {
    try {
      return clearSecret(parseSecretProviderId(provider))
    } catch (error) {
      rejectInvalidPayload(error)
    }
  })

  ipcMain.handle('lingo:secrets:validateOpenRouter', () => validateOpenRouterKey())

  ipcMain.handle('lingo:openrouter:listModels', () => listOpenRouterModelsInMain())

  ipcMain.handle('lingo:chat:complete', (_e, request: unknown) => {
    try {
      return completeChat(parseChatCompleteRequest(request))
    } catch (error) {
      rejectInvalidPayload(error)
    }
  })

  ipcMain.handle(
    'lingo:chat:stream',
    async (event, channel: unknown, request: unknown) => {
      let parsedChannel: string
      let parsedRequest: ReturnType<typeof parseChatStreamRequest>
      try {
        parsedChannel = parseStreamChannel(channel)
        parsedRequest = parseChatStreamRequest(request)
      } catch (error) {
        rejectInvalidPayload(error)
      }

      const signal = registerStreamAbort(parsedChannel)
      try {
        await streamChat(
          parsedRequest,
          (streamEvent) => {
            if (!event.sender.isDestroyed()) {
              event.sender.send(parsedChannel, streamEvent)
            }
          },
          signal,
          event.sender
        )
      } catch (error) {
        const isAbort =
          error instanceof Error &&
          (error.name === 'AbortError' || error.message.includes('aborted'))
        if (!isAbort && !event.sender.isDestroyed()) {
          const message = error instanceof Error ? error.message : 'Stream failed'
          event.sender.send(parsedChannel, { type: 'error', message })
          console.warn('[lingo:chat:stream]', message)
        }
      } finally {
        clearStream(parsedChannel)
      }
    }
  )

  ipcMain.on('lingo:chat:streamAbort', (_e, channel: unknown) => {
    try {
      abortStream(parseStreamChannel(channel))
    } catch (error) {
      console.warn('[lingo] Ignored invalid stream abort channel:', error)
    }
  })

  ipcMain.handle('lingo:stt:transcribe', (_e, request: unknown) => {
    try {
      return transcribeAudio(parseSttTranscribeRequest(request))
    } catch (error) {
      rejectInvalidPayload(error)
    }
  })

  ipcMain.handle('lingo:tts:synthesize', (_e, request: unknown) => {
    try {
      return synthesizeSpeech(parseTtsSynthesizeRequest(request))
    } catch (error) {
      rejectInvalidPayload(error)
    }
  })

  ipcMain.handle('lingo:link:preview', (_e, url: unknown) => {
    try {
      return fetchLinkPreview(parseLinkPreviewUrl(url))
    } catch (error) {
      rejectInvalidPayload(error)
    }
  })

  ipcMain.handle('lingo:files:readDroppedPaths', (_e, paths: unknown) => {
    try {
      return readDroppedFilePaths(parseDroppedFilePaths(paths))
    } catch (error) {
      rejectInvalidPayload(error)
    }
  })

  ipcMain.handle('lingo:app:iconPath', () => resolveAppIconPath() ?? null)

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
