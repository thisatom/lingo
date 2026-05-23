import type { LingoApi, SecretProviderId } from '@/shared/types/ipc'
import { getWebSecret } from '@/shared/api/web-secrets'

const DESKTOP_ONLY =
  'Lingo API is unavailable. Start the desktop app with: npm run dev, or the browser build with: npm run dev:web'

const WEB_UNAVAILABLE =
  'Lingo failed to start in the browser. Reload the page or run: npm run dev:web'

/** Read stored API key — web build only (localStorage). Desktop keys stay in main. */
export function readSecretKey(provider: SecretProviderId): Promise<string | null> {
  if (isElectronApp()) {
    return Promise.reject(
      new Error('API keys are not exposed in the desktop app. Clear the field and enter a new key to replace.')
    )
  }
  return getWebSecret(provider)
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
