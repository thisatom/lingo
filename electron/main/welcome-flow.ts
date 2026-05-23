import type { BrowserWindow, WebContents } from 'electron'
import { app, ipcMain } from 'electron'
import { readWelcomeNeededFromProbe } from './welcome-probe'
import { createWelcomeWindow } from './welcome-window'
import { createMainWindow, loadMainRenderer, showMainWindow } from './window-manager'

let welcomeWindow: BrowserWindow | null = null
let mainWindow: BrowserWindow | null = null
let mainRendererLoaded = false
let welcomeFlowRegistered = false
let launchInFlight: Promise<BrowserWindow> | null = null

const PROBE_TIMEOUT_MS = 5_000
const WELCOME_VISIBLE_TIMEOUT_MS = 6_000

function isWelcomeSender(sender: WebContents): boolean {
  if (!welcomeWindow || welcomeWindow.isDestroyed()) return false
  return sender.id === welcomeWindow.webContents.id
}

async function ensureMainRendererLoaded(): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainRendererLoaded) return

  await loadMainRenderer(mainWindow)
  mainRendererLoaded = true
}

async function openMainWindow(): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createMainWindow({ showOnReady: false, deferLoad: true })
  }
  await ensureMainRendererLoaded()
  showMainWindow(mainWindow)
}

function closeWelcomeWindow(): void {
  if (welcomeWindow && !welcomeWindow.isDestroyed()) {
    welcomeWindow.close()
  }
  welcomeWindow = null
}

function registerWelcomeIpc(): void {
  if (welcomeFlowRegistered) return
  welcomeFlowRegistered = true

  ipcMain.handle('lingo:welcome:finish', (event) => {
    if (!isWelcomeSender(event.sender)) {
      console.warn('[lingo] Ignored welcome:finish from unexpected webContents')
      return
    }

    closeWelcomeWindow()
    void openMainWindow().catch((error) => {
      console.error('[lingo] Failed to open main after welcome:', error)
    })
  })
}

async function readWelcomeNeededWithTimeout(): Promise<boolean> {
  try {
    return await Promise.race([
      readWelcomeNeededFromProbe(),
      new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.warn('[lingo] Welcome probe timed out; opening main window.')
          resolve(false)
        }, PROBE_TIMEOUT_MS)
      })
    ])
  } catch (error) {
    console.warn('[lingo] Welcome probe failed; opening main window:', error)
    return false
  }
}

function openWelcomeIfNeeded(main: BrowserWindow): void {
  let openedMain = false

  const openMainOnce = () => {
    if (openedMain) return
    openedMain = true
    closeWelcomeWindow()
    void openMainWindow().catch((error) => {
      console.error('[lingo] Failed to open main window:', error)
    })
  }

  welcomeWindow = createWelcomeWindow({
    onLoadFailed: () => {
      console.warn('[lingo] Welcome page failed to load; opening main window.')
      openMainOnce()
    }
  })

  const visibleTimer = setTimeout(() => {
    if (welcomeWindow && !welcomeWindow.isDestroyed() && !welcomeWindow.isVisible()) {
      console.warn('[lingo] Welcome window did not appear; opening main window.')
      openMainOnce()
    }
  }, WELCOME_VISIBLE_TIMEOUT_MS)

  welcomeWindow.once('show', () => clearTimeout(visibleTimer))

  welcomeWindow.on('closed', () => {
    clearTimeout(visibleTimer)
    welcomeWindow = null
    if (!openedMain && main && !main.isDestroyed() && !main.isVisible()) {
      openMainOnce()
    }
  })
}

/** Main shell first; full React loads after welcome probe / when showing main. */
export async function launchDesktopWindows(): Promise<BrowserWindow> {
  if (launchInFlight) return launchInFlight

  launchInFlight = (async () => {
    registerWelcomeIpc()

    try {
      // Packaged app: probe localStorage before loading React. Dev: open main immediately.
      const showWelcome = app.isPackaged ? await readWelcomeNeededWithTimeout() : false

      mainWindow = createMainWindow({ showOnReady: false, deferLoad: true })

      if (showWelcome) {
        openWelcomeIfNeeded(mainWindow)
        return mainWindow
      }

      await openMainWindow()
      return mainWindow
    } catch (error) {
      console.error('[lingo] Desktop launch failed:', error)
      await openMainWindow()
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

/** Focus existing main window or start the full desktop launch flow. */
export function focusMainWindow(): void {
  const main = mainWindow
  if (main && !main.isDestroyed()) {
    if (main.isMinimized()) main.restore()
    if (!mainRendererLoaded) {
      void openMainWindow().catch((error) => {
        console.error('[lingo] Failed to focus main window:', error)
      })
      return
    }
    showMainWindow(main)
    return
  }
  void launchDesktopWindows()
}
