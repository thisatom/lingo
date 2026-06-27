import { app, BrowserWindow, ipcMain } from 'electron'

/** Allow debounced chat persist + settings flush; force-close only as last resort. */
const SHUTDOWN_TIMEOUT_MS = 22_000
export const SHUTDOWN_IPC_CHANNEL = 'lingo:app:shutdown-complete'

const closeAllowed = new WeakSet<BrowserWindow>()

type PendingShutdown = {
  forceTimer: ReturnType<typeof setTimeout>
}

const pendingByWindow = new WeakMap<BrowserWindow, PendingShutdown>()

let shutdownIpcRegistered = false

function ensureShutdownIpcHandler(): void {
  if (shutdownIpcRegistered) return
  shutdownIpcRegistered = true

  ipcMain.on(SHUTDOWN_IPC_CHANNEL, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win || !pendingByWindow.has(win)) return

    const pending = pendingByWindow.get(win)
    if (!pending) return

    clearTimeout(pending.forceTimer)
    pendingByWindow.delete(win)

    if (win.isDestroyed()) return
    closeAllowed.add(win)
    win.close()
  })
}

function cancelPendingShutdown(win: BrowserWindow): void {
  const pending = pendingByWindow.get(win)
  if (!pending) return
  clearTimeout(pending.forceTimer)
  pendingByWindow.delete(win)
}

function beginShutdown(mainWindow: BrowserWindow): void {
  ensureShutdownIpcHandler()
  cancelPendingShutdown(mainWindow)

  if (!mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('lingo:app:prepare-shutdown')
  }

  const forceTimer = setTimeout(() => {
    pendingByWindow.delete(mainWindow)
    if (mainWindow.isDestroyed()) return
    closeAllowed.add(mainWindow)
    mainWindow.destroy()
  }, SHUTDOWN_TIMEOUT_MS)

  pendingByWindow.set(mainWindow, { forceTimer })
}

export function allowWindowCloseImmediately(win: BrowserWindow): void {
  ensureShutdownIpcHandler()
  cancelPendingShutdown(win)
  closeAllowed.add(win)
}

/** Intercept window close so the renderer can persist state before exit. */
export function setupGracefulShutdown(mainWindow: BrowserWindow): void {
  ensureShutdownIpcHandler()

  mainWindow.on('close', (event) => {
    if (closeAllowed.has(mainWindow) || mainWindow.isDestroyed()) return

    event.preventDefault()
    beginShutdown(mainWindow)
  })

  mainWindow.on('closed', () => {
    cancelPendingShutdown(mainWindow)
    closeAllowed.delete(mainWindow)
  })
}

/** Ask renderer to persist, resolve when shutdown-complete arrives or timeout hits. */
export function requestRendererFlush(timeoutMs: number): Promise<void> {
  ensureShutdownIpcHandler()

  const windows = BrowserWindow.getAllWindows().filter((win) => !win.isDestroyed())
  if (windows.length === 0) return Promise.resolve()

  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      ipcMain.removeListener(SHUTDOWN_IPC_CHANNEL, onComplete)
      clearTimeout(timer)
      resolve()
    }

    const onComplete = () => finish()
    const timer = setTimeout(finish, timeoutMs)

    ipcMain.on(SHUTDOWN_IPC_CHANNEL, onComplete)

    for (const win of windows) {
      if (win.webContents.isDestroyed()) continue
      cancelPendingShutdown(win)
      pendingByWindow.set(win, {
        forceTimer: setTimeout(() => {
          pendingByWindow.delete(win)
          if (win.isDestroyed()) return
          allowWindowCloseImmediately(win)
        }, timeoutMs)
      })
      win.webContents.send('lingo:app:prepare-shutdown')
    }
  })
}
