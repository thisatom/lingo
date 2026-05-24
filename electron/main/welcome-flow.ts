import type { BrowserWindow } from 'electron'
import { createMainWindow, showMainWindow } from './window-manager'

let mainWindow: BrowserWindow | null = null
let launchInFlight: Promise<BrowserWindow> | null = null

export async function launchDesktopWindows(): Promise<BrowserWindow> {
  if (launchInFlight) return launchInFlight

  launchInFlight = (async () => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) {
        mainWindow = createMainWindow()
      } else {
        showMainWindow(mainWindow)
      }
      return mainWindow!
    } catch (error) {
      console.error('[lingo] Desktop launch failed:', error)
      if (!mainWindow || mainWindow.isDestroyed()) {
        mainWindow = createMainWindow()
      }
      return mainWindow!
    } finally {
      launchInFlight = null
    }
  })()

  return launchInFlight
}

export function getMainWindowRef(): BrowserWindow | null {
  return mainWindow
}

export function focusMainWindow(): void {
  const main = mainWindow
  if (main && !main.isDestroyed()) {
    if (main.isMinimized()) main.restore()
    showMainWindow(main)
    return
  }
  void launchDesktopWindows()
}
