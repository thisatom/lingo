const DEFAULT_API_URL = 'http://localhost:3001'
const DEFAULT_MAX_RESULTS = 4

export function getWebsearchApiUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WEBSEARCH_API_URL) {
    return String(import.meta.env.VITE_WEBSEARCH_API_URL)
  }
  if (typeof process !== 'undefined' && process.env?.LINGO_WEBSEARCH_API_URL) {
    return process.env.LINGO_WEBSEARCH_API_URL
  }
  if (typeof process !== 'undefined' && process.env?.API_URL) {
    return process.env.API_URL
  }
  return DEFAULT_API_URL
}

export function getWebsearchMaxResults(): number {
  const raw =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WEBSEARCH_MAX_RESULTS) ||
    (typeof process !== 'undefined' && process.env?.MAX_SEARCH_RESULT) ||
    (typeof process !== 'undefined' && process.env?.LINGO_WEBSEARCH_MAX_RESULTS) ||
    String(DEFAULT_MAX_RESULTS)
  const n = Number.parseInt(String(raw), 10)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 8) : DEFAULT_MAX_RESULTS
}

export function isNodeRuntime(): boolean {
  return typeof process !== 'undefined' && !!process.versions?.node
}

function isElectronRenderer(): boolean {
  if (typeof process === 'undefined') return false
  const proc = process as typeof process & { type?: string }
  return proc.type === 'renderer'
}

/** Electron main / Node CLI — not the browser or Electron renderer. */
export function canSpawnWebsearchMcp(): boolean {
  if (!isNodeRuntime()) return false
  if (isElectronRenderer()) return false
  if (typeof window !== 'undefined' && typeof document !== 'undefined') return false
  return true
}
