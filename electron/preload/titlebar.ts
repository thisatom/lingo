import { titlebarTheme } from '../../src/shared/config/titlebar'

export async function initCustomTitlebar(): Promise<void> {
  const { Titlebar, TitlebarColor } = await import('@incanta/custom-electron-titlebar')

  const backgroundColor = TitlebarColor.fromHex(titlebarTheme.background)
  const foregroundColor = TitlebarColor.fromHex(titlebarTheme.foreground)

  new Titlebar({
    minWidth: 400,
    minHeight: 270,
    backgroundColor,
    menuBarBackgroundColor: backgroundColor,
    itemBackgroundColor: TitlebarColor.fromHex('#333333'),
    svgColor: foregroundColor,
    unfocusEffect: false,
    removeMenuBar: true
  })

  syncTitlebarInset()
  requestAnimationFrame(syncTitlebarInset)
}

function syncTitlebarInset(): void {
  const bar = document.querySelector('.cet-titlebar')
  const height =
    bar instanceof HTMLElement && bar.offsetHeight > 0 ? bar.offsetHeight : 32
  document.documentElement.style.setProperty('--lingo-titlebar-height', `${height}px`)
}
