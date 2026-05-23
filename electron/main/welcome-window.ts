import { app, BrowserWindow } from 'electron'
import { attachTitlebarToWindow } from '@incanta/custom-electron-titlebar/main'
import { getTitlebarTheme } from '../../src/shared/config/titlebar'
import { resolveAppIconPath } from './icon'
import { resolvePreloadScript } from './paths'
import { packagedRendererUrl } from './renderer-protocol'
import { resolveDevRendererUrl } from './window-manager'

function loadWelcomePage(win: BrowserWindow): void {
  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    const base = resolveDevRendererUrl().replace(/\/$/, '')
    void win.loadURL(`${base}/welcome.html`)
    return
  }
  void win.loadURL(packagedRendererUrl('welcome.html'))
}

export type CreateWelcomeWindowOptions = {
  onLoadFailed?: () => void
}

export function createWelcomeWindow(options: CreateWelcomeWindowOptions = {}): BrowserWindow {
  const iconPath = resolveAppIconPath()
  const theme = getTitlebarTheme('dark')

  const win = new BrowserWindow({
    width: 520,
    height: 620,
    minWidth: 480,
    minHeight: 560,
    maxWidth: 640,
    maxHeight: 760,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    center: true,
    show: true,
    title: 'Welcome to Lingo',
    backgroundColor: theme.background,
    ...(iconPath ? { icon: iconPath } : {}),
    titleBarStyle: 'hidden',
    titleBarOverlay:
      process.platform === 'win32'
        ? {
            color: theme.background,
            symbolColor: theme.foreground,
            height: theme.overlayHeight
          }
        : false,
    webPreferences: {
      preload: resolvePreloadScript(),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  attachTitlebarToWindow(win)

  loadWelcomePage(win)

  win.webContents.once('did-fail-load', (_event, _code, _desc, _url, isMainFrame) => {
    if (!isMainFrame) return
    options.onLoadFailed?.()
  })

  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) {
      win.focus()
    }
  })

  if (!app.isPackaged) {
    setTimeout(() => {
      if (!win.isDestroyed() && !win.isVisible()) {
        win.show()
        win.focus()
      }
    }, 1500)
  }

  return win
}
