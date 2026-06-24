import { BrowserWindow } from 'electron'
import type { AppUpdateProgress } from '../../src/shared/types/ipc'

export function emitAppUpdateProgress(progress: AppUpdateProgress): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed()) continue
    win.webContents.send('lingo:updater:progress', progress)
  }
}
