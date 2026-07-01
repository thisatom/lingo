import type { ShortcutDefinition } from '@/shared/lib/keyboard-shortcuts/types'

const IS_MAC =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)

export function displayModKey(): string {
  return IS_MAC ? 'Cmd' : 'Ctrl'
}

export function formatShortcutDisplayKeys(keys: readonly string[]): string[] {
  return keys.map((key) => (key === 'Ctrl' ? displayModKey() : key))
}

export function formatShortcutLabel(shortcut: ShortcutDefinition): string {
  return formatShortcutDisplayKeys(shortcut.displayKeys).join('+')
}
