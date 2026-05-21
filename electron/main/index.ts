import { app, BrowserWindow, session, shell } from 'electron'
import { registerDevToolsShortcut, unregisterDevToolsShortcut } from './devtools'

// Allow TTS playback after async API calls (no fresh user gesture).
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  attachTitlebarToWindow,
  setupTitlebar
} from '@incanta/custom-electron-titlebar/main'
import { getTitlebarTheme } from '../../src/shared/config/titlebar'
import { backgroundUpdateCheck } from './app-update'
import { registerIpcHandlers } from './ipc'
import { registerWindowShortcuts } from './window-shortcuts'
import { resolveAppIconPath } from './icon'
import { resolvePreloadScript } from './paths'
import { loadEnvBootstrap } from './secrets'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function createWindow(): BrowserWindow {
  const iconPath = resolveAppIconPath()

  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 560,
    show: false,
    backgroundColor: '#121212',
    title: 'Lingo',
    ...(iconPath ? { icon: iconPath } : {}),
    titleBarStyle: 'hidden',
    titleBarOverlay:
      process.platform === 'win32'
        ? (() => {
            const t = getTitlebarTheme('dark')
            return {
              color: t.background,
              symbolColor: t.foreground,
              height: t.overlayHeight
            }
          })()
        : false,
    webPreferences: {
      preload: resolvePreloadScript(),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  attachTitlebarToWindow(mainWindow)
  registerWindowShortcuts(mainWindow)

  if (process.platform === 'win32') {
    const t = getTitlebarTheme('dark')
    mainWindow.setTitleBarOverlay({
      color: t.background,
      symbolColor: t.foreground,
      height: t.overlayHeight
    })
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.once('did-finish-load', () => {
    void backgroundUpdateCheck((info) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('lingo:updater:available', info)
      }
    })
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    const iconPath = resolveAppIconPath()
    if (iconPath) app.dock?.setIcon(iconPath)
  }
  const allowMedia = (permission: string) =>
    permission === 'media' || permission === 'microphone' || permission === 'audioCapture'

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(allowMedia(permission))
  })

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => allowMedia(permission))

  setupTitlebar()
  registerDevToolsShortcut()
  registerIpcHandlers()
  try {
    await loadEnvBootstrap()
  } catch (error) {
    console.error('[lingo] Failed to load API key bootstrap:', error)
  }
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  unregisterDevToolsShortcut()
})
