import { BrowserWindow, globalShortcut } from 'electron'

const DEVTOOLS_SHORTCUTS = [
  'CommandOrControl+Shift+F12',
  'CommandOrControl+Shift+I',
  'F12'
] as const

function toggleFocusedDevTools(): void {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  if (!win || win.webContents.isDestroyed()) return
  win.webContents.toggleDevTools()
}

export function registerDevToolsShortcut(): void {
  for (const accelerator of DEVTOOLS_SHORTCUTS) {
    if (globalShortcut.isRegistered(accelerator)) continue

    const registered = globalShortcut.register(accelerator, toggleFocusedDevTools)
    if (!registered) {
      console.warn(`[lingo] DevTools shortcut not registered (${accelerator} may be taken).`)
    }
  }
}

export function unregisterDevToolsShortcut(): void {
  for (const accelerator of DEVTOOLS_SHORTCUTS) {
    if (globalShortcut.isRegistered(accelerator)) {
      globalShortcut.unregister(accelerator)
    }
  }
}

/** Auto-open DevTools in dev when the renderer fails to paint (blank window debugging). */
export function openDevToolsIfDev(win: BrowserWindow): void {
  if (win.webContents.isDestroyed()) return
  if (process.env.NODE_ENV === 'production' && !process.env.ELECTRON_RENDERER_URL) return
  if (win.webContents.isDevToolsOpened()) return
  win.webContents.openDevTools({ mode: 'detach' })
}
