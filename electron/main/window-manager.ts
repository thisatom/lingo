import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  attachTitlebarToWindow,
  setupTitlebar
} from '@incanta/custom-electron-titlebar/main'
import { getTitlebarTheme } from '../../src/shared/config/titlebar'
import { backgroundUpdateCheck } from './app-update'
import { resolveAppIconPath } from './icon'
import { resolvePreloadScript } from './paths'
import { registerWindowShortcuts } from './window-shortcuts'
import { setupGracefulShutdown } from './shutdown'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createMainWindow(): BrowserWindow {
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
  registerWindowShortcuts(mainWindow, createMainWindow)
  setupGracefulShutdown(mainWindow)

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
    mainWindow.focus()
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

/** One app process; extra launches open another window instead of fighting over cache/shortcuts. */
export function setupSingleInstanceApp(onCreateWindow: () => BrowserWindow): boolean {
  const isPrimary = app.requestSingleInstanceLock()

  if (!isPrimary) {
    app.quit()
    return false
  }

  app.on('second-instance', () => {
    const win = onCreateWindow()
    if (win.isMinimized()) win.restore()
    win.focus()
  })

  return true
}

export function setupTitlebarOnce(): void {
  setupTitlebar()
}
