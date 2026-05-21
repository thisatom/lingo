import { getTitlebarTheme } from '../config/titlebar'
import type { AppTheme, ResolvedTheme } from '../types/app-theme'

export type { AppTheme, ResolvedTheme } from '../types/app-theme'

const THEME_STORAGE_KEY = 'lingo-settings'

export function isAppTheme(value: unknown): value is AppTheme {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function resolveThemePreference(preference: AppTheme): ResolvedTheme {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}

function readPersistedThemePreference(): AppTheme | null {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { appTheme?: unknown }; appTheme?: unknown }
    const value = parsed.state?.appTheme ?? parsed.appTheme
    return isAppTheme(value) ? value : null
  } catch {
    return null
  }
}

/** Apply before React paint to avoid theme flash. */
export function initThemeFromStorage(): ResolvedTheme {
  const preference = readPersistedThemePreference() ?? 'dark'
  return applyThemePreference(preference)
}

export function applyThemePreference(preference: AppTheme): ResolvedTheme {
  const resolved = resolveThemePreference(preference)
  const root = document.documentElement

  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
  root.style.transition = 'background-color 0.2s ease, color 0.2s ease'

  const titlebar = getTitlebarTheme(resolved)
  const metaTheme = document.querySelector('meta[name="theme-color"]')
  if (metaTheme) metaTheme.setAttribute('content', titlebar.background)

  const metaScheme = document.querySelector('meta[name="color-scheme"]')
  if (metaScheme) metaScheme.setAttribute('content', resolved)

  syncSplashSurface(titlebar.background, resolved === 'dark' ? '#d1d1d1' : '#1e1e1e')

  return resolved
}

function syncSplashSurface(background: string, foreground: string): void {
  document.documentElement.style.backgroundColor = background
  document.body.style.backgroundColor = background
  document.body.style.color = foreground
  const root = document.getElementById('root')
  if (root) root.style.backgroundColor = background
  const splash = document.getElementById('app-splash')
  if (splash) splash.style.background = background
}

export function syncNativeTheme(resolved: ResolvedTheme): void {
  const api = (
    window as Window & { lingo?: { theme?: { apply: (t: ResolvedTheme) => void } } }
  ).lingo?.theme
  api?.apply(resolved)
}
