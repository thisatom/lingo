import type { BrowserWindow } from 'electron'
import { getTitlebarTheme } from '../../src/shared/config/titlebar'
import type { ResolvedTheme } from '../../src/shared/types/app-theme'

export function applyWindowTheme(win: BrowserWindow, resolved: ResolvedTheme): void {
  const theme = getTitlebarTheme(resolved)
  win.setBackgroundColor(theme.background)
  if (process.platform === 'win32') {
    win.setTitleBarOverlay({
      color: theme.background,
      symbolColor: theme.foreground,
      height: theme.overlayHeight
    })
  }
}
