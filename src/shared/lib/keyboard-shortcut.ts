/** Match by physical key (`KeyboardEvent.code`), layout-independent. */

export function matchPhysicalKey(event: KeyboardEvent, code: string): boolean {
  return event.code === code
}

export function hasPrimaryModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey
}

export function isNewChatShortcut(event: KeyboardEvent): boolean {
  return (
    matchPhysicalKey(event, 'KeyN') &&
    hasPrimaryModifier(event) &&
    !event.altKey &&
    !event.shiftKey
  )
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
  return (
    matchPhysicalKey(event, 'KeyK') &&
    hasPrimaryModifier(event) &&
    !event.altKey &&
    !event.shiftKey
  )
}

export function isSidebarToggleShortcut(event: KeyboardEvent): boolean {
  return matchPhysicalKey(event, 'KeyB') && hasPrimaryModifier(event)
}

export function isComposerModeTextShortcut(event: KeyboardEvent): boolean {
  return (
    event.ctrlKey &&
    event.shiftKey &&
    !event.altKey &&
    !event.metaKey &&
    matchPhysicalKey(event, 'KeyT')
  )
}

export function isComposerModeConversationShortcut(event: KeyboardEvent): boolean {
  return (
    event.ctrlKey &&
    event.shiftKey &&
    !event.altKey &&
    !event.metaKey &&
    matchPhysicalKey(event, 'KeyV')
  )
}
