export type WindowTitleContext = 'default' | 'settings'

/** Native / titlebar caption — app name only (no chat snippet). */
export function formatWindowTitle(context: WindowTitleContext = 'default'): string {
  if (context === 'settings') return 'Lingo — Settings'
  return 'Lingo'
}
