import { BrowserWindow, globalShortcut } from 'electron'

const DEVTOOLS_ACCELERATOR = 'CommandOrControl+Shift+F12'

export function registerDevToolsShortcut(): void {
  if (globalShortcut.isRegistered(DEVTOOLS_ACCELERATOR)) return

  const registered = globalShortcut.register(DEVTOOLS_ACCELERATOR, () => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    if (!win) return
    win.webContents.toggleDevTools()
  })

  if (!registered) {
    console.warn(
      `[lingo] DevTools shortcut not registered (${DEVTOOLS_ACCELERATOR} may be taken by another app).`
    )
  }
}

export function unregisterDevToolsShortcut(): void {
  if (globalShortcut.isRegistered(DEVTOOLS_ACCELERATOR)) {
    globalShortcut.unregister(DEVTOOLS_ACCELERATOR)
  }
}
