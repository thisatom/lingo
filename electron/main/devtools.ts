import type { BrowserWindow, Input } from 'electron'
import { BrowserWindow as BrowserWindowClass, globalShortcut } from 'electron'

const DEVTOOLS_GLOBAL_SHORTCUTS = [
  'CommandOrControl+Shift+F12',
  'CommandOrControl+Shift+I',
  'F12'
] as const

/** True when the key event should toggle DevTools (window must have focus). */
export function isDevToolsAccelerator(input: Input): boolean {
  if (input.type !== 'keyDown') return false

  if (input.code === 'F12') return true

  const mod = input.control || input.meta
  if (!mod || input.alt || !input.shift) return false

  return input.code === 'KeyI' || input.code === 'F12'
}

export function toggleFocusedDevTools(win?: BrowserWindow): void {
  const target =
    win ??
    BrowserWindowClass.getFocusedWindow() ??
    BrowserWindowClass.getAllWindows()[0]
  if (!target || target.webContents.isDestroyed()) return
  target.webContents.toggleDevTools()
}

/** F12 / Ctrl+Shift+I while the Lingo window is focused — works without globalShortcut. */
export function registerDevToolsWindowShortcuts(win: BrowserWindow): void {
  if (process.env.NODE_ENV === 'production' && !process.env.ELECTRON_RENDERER_URL) return

  win.webContents.on('before-input-event', (event, input) => {
    if (!isDevToolsAccelerator(input)) return
    event.preventDefault()
    toggleFocusedDevTools(win)
  })
}

/**
 * Optional global fallback when another app does not capture the accelerator.
 * Registers at most one shortcut; no warn spam when the OS/IDE already owns them.
 */
export function registerDevToolsShortcut(): void {
  if (process.env.NODE_ENV === 'production' && !process.env.ELECTRON_RENDERER_URL) return

  for (const accelerator of DEVTOOLS_GLOBAL_SHORTCUTS) {
    if (globalShortcut.isRegistered(accelerator)) return
    if (globalShortcut.register(accelerator, () => toggleFocusedDevTools())) return
  }
}

export function unregisterDevToolsShortcut(): void {
  for (const accelerator of DEVTOOLS_GLOBAL_SHORTCUTS) {
    if (globalShortcut.isRegistered(accelerator)) {
      globalShortcut.unregister(accelerator)
    }
  }
}

/** Auto-open DevTools in dev when the renderer finishes loading. */
export function openDevToolsIfDev(win: BrowserWindow): void {
  if (win.webContents.isDestroyed()) return
  if (process.env.NODE_ENV === 'production' && !process.env.ELECTRON_RENDERER_URL) return
  if (win.webContents.isDevToolsOpened()) return
  win.webContents.openDevTools({ mode: 'detach' })
}
