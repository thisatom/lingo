import { describe, expect, it } from 'vitest'
import {
  isChatSearchShortcut,
  isComposerModeTextShortcut,
  isNewChatShortcut
} from './keyboard-shortcut'

function keyEvent(code: string, init: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return { code, altKey: false, shiftKey: false, ctrlKey: false, metaKey: false, ...init } as KeyboardEvent
}

describe('keyboard-shortcut', () => {
  it('matches Ctrl+N by physical KeyN (layout-independent)', () => {
    expect(isNewChatShortcut(keyEvent('KeyN', { ctrlKey: true }))).toBe(true)
    expect(isNewChatShortcut(keyEvent('KeyN', { metaKey: true }))).toBe(true)
    expect(isNewChatShortcut(keyEvent('KeyN', { ctrlKey: true, key: 'т' }))).toBe(true)
    expect(isNewChatShortcut(keyEvent('KeyM', { ctrlKey: true }))).toBe(false)
  })

  it('matches Ctrl+K by physical KeyK', () => {
    expect(isChatSearchShortcut(keyEvent('KeyK', { ctrlKey: true }))).toBe(true)
    expect(isChatSearchShortcut(keyEvent('KeyK', { ctrlKey: true, key: 'л' }))).toBe(true)
  })

  it('matches Ctrl+Shift+T by physical KeyT', () => {
    expect(
      isComposerModeTextShortcut(
        keyEvent('KeyT', { ctrlKey: true, shiftKey: true, key: 'е' })
      )
    ).toBe(true)
  })
})
