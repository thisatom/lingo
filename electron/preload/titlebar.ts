export const TITLEBAR_BG = '#141414'
export const TITLEBAR_FG = '#d1d1d1'

export async function initCustomTitlebar(): Promise<void> {
  const { Titlebar, TitlebarColor } = await import('@incanta/custom-electron-titlebar')

  const backgroundColor = TitlebarColor.fromHex(TITLEBAR_BG)
  const foregroundColor = TitlebarColor.fromHex(TITLEBAR_FG)

  new Titlebar({
    minWidth: 400,
    minHeight: 270,
    backgroundColor,
    menuBarBackgroundColor: backgroundColor,
    itemBackgroundColor: TitlebarColor.fromHex('#2a2a2a'),
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
