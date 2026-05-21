import { createBrowserLingoApi } from '@/shared/api/browser-lingo'

/** True when running the Vite web build (browser), not Electron preload. */
export function isWebPlatform(): boolean {
  return import.meta.env.VITE_LINGO_PLATFORM === 'web'
}

export function isElectronApp(): boolean {
  return window.lingo?.platform === 'electron'
}

/**
 * Installs `window.lingo` for browser builds. Electron preload sets the bridge earlier.
 */
export function ensureLingoBridge(): void {
  if (window.lingo?.secrets && window.lingo?.chat) return
  if (!isWebPlatform()) return

  document.documentElement.classList.add('lingo-web')
  document.documentElement.style.setProperty('--lingo-titlebar-height', '0px')
  window.lingo = createBrowserLingoApi()
}
