import type { LingoApi } from '@/shared/types/ipc'

const DESKTOP_ONLY =
  'Lingo API is unavailable. Start the desktop app with: npm run dev'

export function getLingo(): LingoApi {
  const api = window.lingo
  if (!api?.secrets || !api?.chat || !api?.tts) {
    throw new Error(DESKTOP_ONLY)
  }
  return api
}

export function isLingoAvailable(): boolean {
  return Boolean(window.lingo?.secrets)
}
