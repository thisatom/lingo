import type { BrowserWindow } from 'electron'

/** Prevent Chromium from handling Ctrl/Cmd+N and forward to the renderer. */
export function registerWindowShortcuts(
  win: BrowserWindow,
  onNewWindow?: () => BrowserWindow
): void {
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    const mod = input.control || input.meta
    if (!mod || input.alt) return

    if (input.shift && input.code === 'KeyN' && onNewWindow) {
      event.preventDefault()
      const next = onNewWindow()
      if (!next.isDestroyed()) next.focus()
      return
    }

    if (!input.shift && input.code === 'KeyN') {
      event.preventDefault()
      if (!win.webContents.isDestroyed()) {
        win.webContents.send('lingo:shortcut:new-chat')
      }
    }
  })
}
