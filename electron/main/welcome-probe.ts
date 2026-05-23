import { app, BrowserWindow } from 'electron'
import { readWelcomeNeeded } from './read-welcome-needed'
import { packagedRendererUrl } from './renderer-protocol'
import { resolveDevRendererUrl } from './window-manager'

async function loadWelcomeProbePage(win: BrowserWindow): Promise<void> {
  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    const base = resolveDevRendererUrl().replace(/\/$/, '')
    await win.loadURL(`${base}/welcome-probe.html`)
    return
  }
  await win.loadURL(packagedRendererUrl('welcome-probe.html'))
}

/** Lightweight hidden window — reads localStorage without loading the full React app. */
export async function readWelcomeNeededFromProbe(): Promise<boolean> {
  const probe = new BrowserWindow({
    show: false,
    width: 320,
    height: 240,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  try {
    await loadWelcomeProbePage(probe)
    return await readWelcomeNeeded(probe)
  } catch (error) {
    console.warn('[lingo] Welcome probe failed; opening main window:', error)
    return false
  } finally {
    if (!probe.isDestroyed()) probe.destroy()
  }
}
