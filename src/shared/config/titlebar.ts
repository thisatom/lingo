import type { ResolvedTheme } from '../types/app-theme'

export interface TitlebarColors {
  background: string
  foreground: string
  itemHover: string
  overlayHeight: number
}

const TITLEBAR_THEMES: Record<ResolvedTheme, TitlebarColors> = {
  dark: {
    background: '#181818',
    foreground: '#ececec',
    itemHover: '#252525',
    overlayHeight: 32
  },
  light: {
    background: '#fafafa',
    foreground: '#18181b',
    itemHover: '#ececef',
    overlayHeight: 32
  }
}

/** @deprecated Use getTitlebarTheme(resolved) */
export const titlebarTheme = TITLEBAR_THEMES.dark

export function getTitlebarTheme(resolved: ResolvedTheme): TitlebarColors {
  return TITLEBAR_THEMES[resolved]
}
