export const TITLEBAR_BG = '#121212'
export const TITLEBAR_FG = '#e4e4e4'

export async function initCustomTitlebar(): Promise<void> {
  const { Titlebar, TitlebarColor } = await import('@incanta/custom-electron-titlebar')

  const backgroundColor = TitlebarColor.fromHex(TITLEBAR_BG)
  const foregroundColor = TitlebarColor.fromHex(TITLEBAR_FG)

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
