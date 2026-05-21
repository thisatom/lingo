/** Native / titlebar caption: `Lingo` or `Lingo - {segment}`. */
export function formatWindowTitle(segment?: string | null): string {
  const trimmed = segment?.trim()
  if (!trimmed) return 'Lingo'
  return `Lingo - ${trimmed}`
}
