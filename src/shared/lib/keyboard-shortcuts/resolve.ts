import { useSettingsStore } from '@/entities/settings/model/store'
import { KEYBOARD_SHORTCUTS, getShortcutDefinition } from '@/shared/lib/keyboard-shortcuts/definitions'
import type {
  ShortcutBinding,
  ShortcutDefinition,
  ShortcutId
} from '@/shared/lib/keyboard-shortcuts/types'

const MODIFIER_ONLY_CODES = new Set([
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight'
])

const CODE_DISPLAY: Record<string, string> = {
  Enter: 'Enter',
  Escape: 'Esc',
  Tab: 'Tab',
  Space: 'Space',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backslash: '\\',
  BracketLeft: '[',
  BracketRight: ']',
  Semicolon: ';',
  Quote: "'",
  Minus: '-',
  Equal: '=',
  Backquote: '`'
}

/** Shortcuts that intentionally share the same binding in different routes. */
const SHARED_BINDING_GROUPS: readonly (readonly ShortcutId[])[] = [['chatSearch', 'settingsSearch']]

export function codeToDisplayKey(code: string): string {
  if (CODE_DISPLAY[code]) return CODE_DISPLAY[code]
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Arrow')) return code.slice(5)
  return code
}

export function bindingToDisplayKeys(binding: ShortcutBinding): string[] {
  const keys: string[] = []

  if (binding.primaryMod === true) keys.push('Ctrl')
  if (binding.shift) keys.push('Shift')
  if (binding.alt) keys.push('Alt')
  keys.push(codeToDisplayKey(binding.code))
  return keys
}

export function bindingsEqual(a: ShortcutBinding, b: ShortcutBinding): boolean {
  return (
    a.code === b.code &&
    Boolean(a.primaryMod) === Boolean(b.primaryMod) &&
    Boolean(a.shift) === Boolean(b.shift) &&
    Boolean(a.alt) === Boolean(b.alt) &&
    (a.primaryModRequired ?? true) === (b.primaryModRequired ?? true)
  )
}

export function resolveShortcutDefinition(
  definition: ShortcutDefinition,
  override?: ShortcutBinding | null
): ShortcutDefinition {
  if (!override) return definition
  return {
    ...definition,
    binding: override,
    displayKeys: bindingToDisplayKeys(override)
  }
}

export function getResolvedShortcut(id: ShortcutId): ShortcutDefinition {
  const overrides = useSettingsStore.getState().keyboardShortcutOverrides ?? {}
  return resolveShortcutDefinition(getShortcutDefinition(id), overrides[id])
}

export function getAllResolvedShortcuts(): ShortcutDefinition[] {
  const overrides = useSettingsStore.getState().keyboardShortcutOverrides ?? {}
  return KEYBOARD_SHORTCUTS.map((definition) =>
    resolveShortcutDefinition(definition, overrides[definition.id])
  )
}

function areInSameSharedGroup(a: ShortcutId, b: ShortcutId): boolean {
  return SHARED_BINDING_GROUPS.some((group) => group.includes(a) && group.includes(b))
}

export function findShortcutConflict(
  id: ShortcutId,
  binding: ShortcutBinding
): ShortcutId | null {
  const overrides = useSettingsStore.getState().keyboardShortcutOverrides ?? {}
  for (const definition of KEYBOARD_SHORTCUTS) {
    if (definition.id === id) continue
    const resolved = resolveShortcutDefinition(definition, overrides[definition.id])
    if (!bindingsEqual(resolved.binding, binding)) continue
    if (areInSameSharedGroup(id, definition.id)) continue
    return definition.id
  }
  return null
}

export function bindingFromKeyboardEvent(event: KeyboardEvent): ShortcutBinding | null {
  if (event.code === 'Tab') return null
  if (MODIFIER_ONLY_CODES.has(event.code)) return null

  const hasMod = event.ctrlKey || event.metaKey
  const binding: ShortcutBinding = { code: event.code }

  if (hasMod) {
    binding.primaryMod = true
  } else if (event.code === 'Enter' || event.code === 'Escape') {
    binding.primaryModRequired = false
  }

  if (event.shiftKey) binding.shift = true
  if (event.altKey) binding.alt = true

  return binding
}
