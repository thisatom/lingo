import { getResolvedShortcut } from '@/shared/lib/keyboard-shortcuts/resolve'
import type { ShortcutBinding, ShortcutId } from '@/shared/lib/keyboard-shortcuts/types'

export function matchPhysicalKey(event: KeyboardEvent, code: string): boolean {
  return event.code === code
}

export function hasPrimaryModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey
}

export function matchesBinding(event: KeyboardEvent, binding: ShortcutBinding): boolean {
  const wantsMod = binding.primaryMod !== false
  const hasMod = hasPrimaryModifier(event)

  if (binding.primaryModRequired === false) {
    if (hasMod) return false
  } else if (wantsMod && !hasMod) {
    return false
  } else if (!wantsMod && hasMod) {
    return false
  }

  if (Boolean(binding.shift) !== event.shiftKey) return false
  if (binding.alt != null && binding.alt !== event.altKey) return false

  return matchPhysicalKey(event, binding.code)
}

export function matchesShortcut(event: KeyboardEvent, id: ShortcutId): boolean {
  return matchesBinding(event, getResolvedShortcut(id).binding)
}

/** Legacy helpers — kept for existing imports. */
export function isNewChatShortcut(event: KeyboardEvent): boolean {
  return matchesShortcut(event, 'newChat')
}

export function isNewWindowShortcut(event: KeyboardEvent): boolean {
  return (
    matchPhysicalKey(event, 'KeyN') &&
    hasPrimaryModifier(event) &&
    event.shiftKey &&
    !event.altKey
  )
}

export function isChatSearchShortcut(event: KeyboardEvent): boolean {
  return matchesShortcut(event, 'chatSearch')
}

export function isSettingsSearchShortcut(event: KeyboardEvent): boolean {
  return matchesShortcut(event, 'settingsSearch')
}

export function isSidebarToggleShortcut(event: KeyboardEvent): boolean {
  return matchesShortcut(event, 'toggleSidebar')
}

export function isArchiveChatShortcut(event: KeyboardEvent): boolean {
  return matchesShortcut(event, 'archiveChat')
}

export function isOpenSettingsShortcut(event: KeyboardEvent): boolean {
  return matchesShortcut(event, 'openSettings')
}

export function isVoiceInputShortcut(event: KeyboardEvent): boolean {
  return matchesShortcut(event, 'voiceInput')
}

export function isStopAgentShortcut(event: KeyboardEvent): boolean {
  return matchesShortcut(event, 'stopAgent')
}

export function isComposerModeTextShortcut(event: KeyboardEvent): boolean {
  return matchesShortcut(event, 'composerTextMode')
}

export function isComposerModeConversationShortcut(event: KeyboardEvent): boolean {
  return matchesShortcut(event, 'composerConversationMode')
}
