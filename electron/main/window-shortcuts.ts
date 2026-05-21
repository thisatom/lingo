import type { BrowserWindow } from 'electron'

/** Prevent Chromium from handling Ctrl/Cmd+N and forward to the renderer. */
export function registerWindowShortcuts(win: BrowserWindow): void {
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    const mod = input.control || input.meta
    if (!mod || input.alt || input.shift) return
    if (input.key.toLowerCase() !== 'n') return

    event.preventDefault()
    if (!win.webContents.isDestroyed()) {
      win.webContents.send('lingo:shortcut:new-chat')
    }
  })
}
