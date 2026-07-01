import type { ShortcutDefinition, ShortcutId } from '@/shared/lib/keyboard-shortcuts/types'

export const KEYBOARD_SHORTCUTS: readonly ShortcutDefinition[] = [
  {
    id: 'newChat',
    label: 'New chat',
    description: 'Create a new conversation',
    category: 'navigation',
    binding: { code: 'KeyN', primaryMod: true },
    displayKeys: ['Ctrl', 'N']
  },
  {
    id: 'chatSearch',
    label: 'Search chats',
    description: 'Open chat search',
    category: 'navigation',
    binding: { code: 'KeyK', primaryMod: true },
    displayKeys: ['Ctrl', 'K']
  },
  {
    id: 'settingsSearch',
    label: 'Search settings',
    description: 'Open settings search while in Settings',
    category: 'navigation',
    binding: { code: 'KeyK', primaryMod: true },
    displayKeys: ['Ctrl', 'K']
  },
  {
    id: 'openSettings',
    label: 'Open settings',
    description: 'Go to Settings',
    category: 'navigation',
    binding: { code: 'Comma', primaryMod: true },
    displayKeys: ['Ctrl', ',']
  },
  {
    id: 'toggleSidebar',
    label: 'Toggle sidebar',
    description: 'Show or hide the sidebar panel',
    category: 'navigation',
    binding: { code: 'KeyB', primaryMod: true },
    displayKeys: ['Ctrl', 'B']
  },
  {
    id: 'archiveChat',
    label: 'Archive chat',
    description: 'Archive the active chat',
    category: 'chat',
    binding: { code: 'KeyE', primaryMod: true, shift: true },
    displayKeys: ['Ctrl', 'Shift', 'E']
  },
  {
    id: 'composerTextMode',
    label: 'Text mode',
    description: 'Switch composer to text mode',
    category: 'composer',
    binding: { code: 'KeyT', primaryMod: true, shift: true, alt: false },
    displayKeys: ['Ctrl', 'Shift', 'T']
  },
  {
    id: 'composerConversationMode',
    label: 'Conversation mode',
    description: 'Switch composer to live conversation mode',
    category: 'composer',
    binding: { code: 'KeyV', primaryMod: true, shift: true, alt: false },
    displayKeys: ['Ctrl', 'Shift', 'V']
  },
  {
    id: 'voiceInput',
    label: 'Voice input',
    description: 'Start or toggle the microphone (same as the mic button)',
    category: 'voice',
    binding: { code: 'KeyM', primaryMod: true },
    displayKeys: ['Ctrl', 'M']
  },
  {
    id: 'sendMessage',
    label: 'Send message',
    description: 'Send the current message (Shift+Enter inserts a new line)',
    category: 'composer',
    binding: { code: 'Enter', primaryModRequired: false },
    displayKeys: ['Enter']
  },
  {
    id: 'stopAgent',
    label: 'Stop',
    description: 'Stop the agent, recording, or live conversation',
    category: 'voice',
    binding: { code: 'Escape', primaryModRequired: false },
    displayKeys: ['Esc']
  }
] as const

const SHORTCUT_BY_ID = new Map<ShortcutId, ShortcutDefinition>(
  KEYBOARD_SHORTCUTS.map((shortcut) => [shortcut.id, shortcut])
)

export function getShortcutDefinition(id: ShortcutId): ShortcutDefinition {
  const def = SHORTCUT_BY_ID.get(id)
  if (!def) throw new Error(`Unknown shortcut: ${id}`)
  return def
}

export const SHORTCUTS_BY_CATEGORY = KEYBOARD_SHORTCUTS.reduce<
  Record<ShortcutDefinition['category'], ShortcutDefinition[]>
>(
  (acc, shortcut) => {
    acc[shortcut.category].push(shortcut)
    return acc
  },
  { navigation: [], chat: [], composer: [], voice: [] }
)

export const SHORTCUT_CATEGORY_LABELS: Record<ShortcutDefinition['category'], string> = {
  navigation: 'Navigation',
  chat: 'Chat',
  composer: 'Composer',
  voice: 'Voice & agent'
}
