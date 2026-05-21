import type { LingoApi, SecretProviderId } from '@/shared/types/ipc'

const DESKTOP_ONLY =
  'Lingo API is unavailable. Start the desktop app with: npm run dev, or the browser build with: npm run dev:web'

const WEB_UNAVAILABLE =
  'Lingo failed to start in the browser. Reload the page or run: npm run dev:web'

const RESTART_HINT =
  'Restart the app (npm run dev) so the desktop bridge reloads — API key reveal needs an updated preload.'

export function readSecretKey(provider: SecretProviderId): Promise<string | null> {
  const api = getLingo()
  const read = api.secrets.readKey ?? api.secrets.get
  if (typeof read !== 'function') {
    throw new Error(RESTART_HINT)
  }
  return read(provider)
}

export function getLingo(): LingoApi {
  const api = window.lingo
  if (!api?.secrets || !api?.chat || !api?.stt || !api?.tts) {
    throw new Error(import.meta.env.VITE_LINGO_PLATFORM === 'web' ? WEB_UNAVAILABLE : DESKTOP_ONLY)
  }
  return api
}

export function isLingoAvailable(): boolean {
  return Boolean(window.lingo?.secrets && window.lingo?.chat)
}

export function isElectronApp(): boolean {
  return window.lingo?.platform === 'electron'
}
