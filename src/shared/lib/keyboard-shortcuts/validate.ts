import { KEYBOARD_SHORTCUTS } from '@/shared/lib/keyboard-shortcuts/definitions'
import type { ShortcutBinding, ShortcutId } from '@/shared/lib/keyboard-shortcuts/types'

export function isShortcutBinding(value: unknown): value is ShortcutBinding {
  if (!value || typeof value !== 'object') return false
  const binding = value as Record<string, unknown>
  if (typeof binding.code !== 'string' || !binding.code.trim()) return false
  for (const key of ['primaryMod', 'shift', 'alt', 'primaryModRequired'] as const) {
    if (binding[key] != null && typeof binding[key] !== 'boolean') return false
  }
  return true
}

export function isShortcutId(value: unknown): value is ShortcutId {
  return KEYBOARD_SHORTCUTS.some((shortcut) => shortcut.id === value)
}

export function sanitizeKeyboardShortcutOverrides(
  value: unknown
): Partial<Record<ShortcutId, ShortcutBinding>> {
  if (!value || typeof value !== 'object') return {}
  const result: Partial<Record<ShortcutId, ShortcutBinding>> = {}
  for (const [key, binding] of Object.entries(value)) {
    if (!isShortcutId(key) || !isShortcutBinding(binding)) continue
    result[key] = binding
  }
  return result
}
