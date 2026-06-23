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
    foreground: '#e4e4e4',
    itemHover: '#333333',
    overlayHeight: 32
  },
  light: {
    background: '#ebebeb',
    foreground: '#1e1e1e',
    itemHover: '#d8d8d8',
    overlayHeight: 32
  }
}

/** @deprecated Use getTitlebarTheme(resolved) */
export const titlebarTheme = TITLEBAR_THEMES.dark

export function getTitlebarTheme(resolved: ResolvedTheme): TitlebarColors {
  return TITLEBAR_THEMES[resolved]
}
