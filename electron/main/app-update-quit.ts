import { app, BrowserWindow } from 'electron'
import { allowWindowCloseImmediately, requestRendererFlush } from './shutdown'

const UPDATE_FLUSH_TIMEOUT_MS = 8_000

/** Force exit without graceful close handlers — used after update script is spawned. */
export function exitAppForUpdate(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed()) continue
    allowWindowCloseImmediately(win)
    win.destroy()
  }
  app.exit(0)
}

/** Persist renderer state, then exit so the detached installer can replace files. */
export async function flushThenExitForUpdate(): Promise<void> {
  await requestRendererFlush(UPDATE_FLUSH_TIMEOUT_MS)
  exitAppForUpdate()
}
