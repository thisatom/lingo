export type ShortcutCategory = 'navigation' | 'chat' | 'composer' | 'voice'

export type ShortcutId =
  | 'newChat'
  | 'chatSearch'
  | 'settingsSearch'
  | 'openSettings'
  | 'toggleSidebar'
  | 'archiveChat'
  | 'composerTextMode'
  | 'composerConversationMode'
  | 'voiceInput'
  | 'sendMessage'
  | 'stopAgent'

export type ShortcutBinding = {
  code: string
  primaryMod?: boolean
  shift?: boolean
  alt?: boolean
  /** When false, primary modifier must not be held (e.g. Enter). */
  primaryModRequired?: boolean
}

export type ShortcutDefinition = {
  id: ShortcutId
  label: string
  description: string
  category: ShortcutCategory
  binding: ShortcutBinding
  /** Human-readable key caps for settings UI (Ctrl = Cmd on macOS in display). */
  displayKeys: readonly string[]
}
