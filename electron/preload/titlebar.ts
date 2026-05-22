import { getTitlebarTheme } from '../../src/shared/config/titlebar'
import { resolveThemePreference } from '../../src/shared/lib/theme'
import type { AppTheme } from '../../src/shared/types/app-theme'
import type { ResolvedTheme } from '../../src/shared/types/app-theme'

type TitlebarHandle = {
  updateTitle: (title: string) => unknown
  updateBackground: (color: unknown) => unknown
  updateItemBGColor: (color: unknown) => unknown
}

let titlebarInstance: TitlebarHandle | null = null

export async function initCustomTitlebar(): Promise<void> {
  const { Titlebar, TitlebarColor } = await import('@incanta/custom-electron-titlebar')

  const resolved = resolveThemePreference(readThemePreference())
  const colors = getTitlebarTheme(resolved)
  const titlebarIcon = resolveTitlebarIconUrl()

  titlebarInstance = new Titlebar({
    minWidth: 400,
    minHeight: 270,
    backgroundColor: TitlebarColor.fromHex(colors.background),
    menuBarBackgroundColor: TitlebarColor.fromHex(colors.background),
    itemBackgroundColor: TitlebarColor.fromHex(colors.itemHover),
    svgColor: TitlebarColor.fromHex(colors.foreground),
    ...(titlebarIcon ? { icon: titlebarIcon, iconSize: 16 as const } : {}),
    unfocusEffect: false,
    removeMenuBar: true
  }) as unknown as TitlebarHandle

  syncTitlebarInset()
  requestAnimationFrame(syncTitlebarInset)
  watchThemeForTitlebar(TitlebarColor)
}

export function applyTitlebarTheme(
  resolved: ResolvedTheme,
  TitlebarColor?: { fromHex: (hex: string) => unknown }
): void {
  void import('@incanta/custom-electron-titlebar').then(({ TitlebarColor: Color }) => {
    const colors = getTitlebarTheme(resolved)
    const fromHex = TitlebarColor?.fromHex ?? Color.fromHex
    const background = fromHex(colors.background)
    const foreground = fromHex(colors.foreground)
    const itemHover = fromHex(colors.itemHover)

    if (titlebarInstance) {
      titlebarInstance.updateBackground(background)
      titlebarInstance.updateItemBGColor(itemHover)
    }
  })
}

export function updateTitlebarCaption(title: string): void {
  document.title = title
  titlebarInstance?.updateTitle(title)
}

function readThemePreference(): AppTheme {
  try {
    const raw = localStorage.getItem('lingo-settings')
    if (!raw) return 'dark'
    const parsed = JSON.parse(raw) as { state?: { appTheme?: unknown } }
    const value = parsed.state?.appTheme
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    // ignore
  }
  return 'dark'
}

function watchThemeForTitlebar(
  TitlebarColor: { fromHex: (hex: string) => unknown }
): void {
  const observer = new MutationObserver(() => {
    const resolved = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    applyTitlebarTheme(resolved, TitlebarColor)
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
}

/** PNG from the renderer origin — never a main-process `file://` .ico path (blocked on localhost). */
function resolveTitlebarIconUrl(): string | undefined {
  try {
    return new URL('icon.png', window.location.href).href
  } catch {
    return undefined
  }
}

function syncTitlebarInset(): void {
  const bar = document.querySelector('.cet-titlebar')
  const height =
    bar instanceof HTMLElement && bar.offsetHeight > 0 ? bar.offsetHeight : 32
  document.documentElement.style.setProperty('--lingo-titlebar-height', `${height}px`)
}
