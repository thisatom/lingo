import type { BrowserWindow } from 'electron'
import {
  CHATS_STORAGE_KEY,
  evaluateWelcomeNeeded,
  parseWelcomePersistPayload,
  SETTINGS_STORAGE_KEY
} from '@/shared/lib/needs-welcome-window'

const READ_PERSISTED_SCRIPT = `
(() => {
  try {
    const settingsRaw = localStorage.getItem(${JSON.stringify(SETTINGS_STORAGE_KEY)});
    const chatsRaw = localStorage.getItem(${JSON.stringify(CHATS_STORAGE_KEY)});
    let settings = null;
    let chats = null;
    if (settingsRaw) {
      try {
        settings = JSON.parse(settingsRaw);
      } catch {
        return { error: 'settings_parse' };
      }
    }
    if (chatsRaw) {
      try {
        chats = JSON.parse(chatsRaw);
      } catch {
        return { error: 'chats_parse' };
      }
    }
    return { settings, chats };
  } catch {
    return { error: 'storage' };
  }
})()
`

/** Fail-closed: on read errors, skip welcome and open main. */
export async function readWelcomeNeeded(win: BrowserWindow): Promise<boolean> {
  try {
    const raw = await win.webContents.executeJavaScript(READ_PERSISTED_SCRIPT, true)
    const parsed = parseWelcomePersistPayload(raw)
    if (!parsed.ok) {
      console.warn('[lingo] Welcome check failed (%s); opening main window.', parsed.reason)
      return false
    }
    return evaluateWelcomeNeeded(parsed)
  } catch (error) {
    console.error('[lingo] Welcome check failed; opening main window:', error)
    return false
  }
}

const LOAD_TIMEOUT_MS = 8_000

export function whenMainPageLoaded(
  win: BrowserWindow,
  timeoutMs = LOAD_TIMEOUT_MS
): Promise<void> {
  if (!win.webContents.isLoadingMainFrame()) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Page load timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    const finish = (error?: Error) => {
      clearTimeout(timer)
      if (error) reject(error)
      else resolve()
    }

    win.webContents.once('did-finish-load', () => finish())
    win.webContents.once('did-fail-load', (_event, code, description, _url, isMainFrame) => {
      if (!isMainFrame) return
      finish(new Error(`Load failed (${code}): ${description}`))
    })
  })
}
