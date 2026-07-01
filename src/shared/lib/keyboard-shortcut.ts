/** @deprecated Import from `@/shared/lib/keyboard-shortcuts/match` instead. */
export {
  hasPrimaryModifier,
  isArchiveChatShortcut,
  isChatSearchShortcut,
  isComposerModeConversationShortcut,
  isComposerModeTextShortcut,
  isNewChatShortcut,
  isNewWindowShortcut,
  isOpenSettingsShortcut,
  isSettingsSearchShortcut,
  isSidebarToggleShortcut,
  isStopAgentShortcut,
  isVoiceInputShortcut,
  matchPhysicalKey,
  matchesShortcut
} from '@/shared/lib/keyboard-shortcuts/match'

export {
  bindingFromKeyboardEvent,
  bindingToDisplayKeys,
  bindingsEqual,
  findShortcutConflict,
  getAllResolvedShortcuts,
  getResolvedShortcut,
  resolveShortcutDefinition
} from '@/shared/lib/keyboard-shortcuts/resolve'
