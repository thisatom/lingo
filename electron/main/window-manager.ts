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
import { packagedRendererUrl } from './renderer-protocol'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Vite dev server may bind to 127.0.0.1 while electron-vite sets localhost — fix ERR_FAILED on Windows. */
export function resolveDevRendererUrl(): string {
  const raw = process.env.ELECTRON_RENDERER_URL ?? 'http://127.0.0.1:5173/'
  return raw.replace('//localhost:', '//127.0.0.1:').replace('//[::1]:', '//127.0.0.1:')
}

export type CreateMainWindowOptions = {
  /** When false, window stays hidden until `showMainWindow` (welcome flow). */
  showOnReady?: boolean
  /** When true, create the shell but do not load the renderer until `loadMainRenderer`. */
  deferLoad?: boolean
}

async function loadRendererUrl(
  mainWindow: BrowserWindow,
  url: string,
  attempts = 4
): Promise<void> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await mainWindow.loadURL(url)
      return
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
      }
    }
  }
  console.error(`[lingo] Renderer failed to load (${url}):`, lastError)
  throw lastError
}

export function loadMainRenderer(mainWindow: BrowserWindow): Promise<void> {
  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    return loadRendererUrl(mainWindow, resolveDevRendererUrl())
  }
  return mainWindow.loadURL(packagedRendererUrl('index.html'))
}

export function createMainWindow(options: CreateMainWindowOptions = {}): BrowserWindow {
  const showOnReady = options.showOnReady !== false
  const deferLoad = options.deferLoad === true
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
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  attachTitlebarToWindow(mainWindow)
  registerWindowShortcuts(mainWindow)
  setupGracefulShutdown(mainWindow)

  if (process.platform === 'win32') {
    const t = getTitlebarTheme('dark')
    mainWindow.setTitleBarOverlay({
      color: t.background,
      symbolColor: t.foreground,
      height: t.overlayHeight
    })
  }

  if (showOnReady) {
    mainWindow.on('ready-to-show', () => {
      showMainWindow(mainWindow)
    })
  }

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

  if (!deferLoad) {
    void loadMainRenderer(mainWindow)
  }

  return mainWindow
}

export function showMainWindow(mainWindow: BrowserWindow): void {
  if (mainWindow.isDestroyed()) return
  mainWindow.show()
  mainWindow.focus()
}

/** One app process; extra launches focus the existing main window. */
export function setupSingleInstanceApp(onSecondInstance: () => void): boolean {
  const isPrimary = app.requestSingleInstanceLock()

  if (!isPrimary) {
    console.warn('[lingo] Another Lingo instance is already running — focusing it.')
    app.quit()
    return false
  }

  app.on('second-instance', () => {
    onSecondInstance()
  })

  return true
}

export function setupTitlebarOnce(): void {
  setupTitlebar()
}
