import { beforeEach, describe, expect, it } from 'vitest'
import { useSettingsStore } from '@/entities/settings/model/store'
import { getShortcutDefinition } from '@/shared/lib/keyboard-shortcuts/definitions'
import {
  bindingFromKeyboardEvent,
  bindingToDisplayKeys,
  bindingsEqual,
  findShortcutConflict,
  getResolvedShortcut,
  resolveShortcutDefinition
} from '@/shared/lib/keyboard-shortcuts/resolve'

function keyEvent(code: string, init: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    code,
    altKey: false,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    ...init
  } as KeyboardEvent
}

describe('bindingToDisplayKeys', () => {
  it('maps modifier chords to display keys', () => {
    expect(
      bindingToDisplayKeys({ code: 'KeyN', primaryMod: true })
    ).toEqual(['Ctrl', 'N'])
  })

  it('includes shift and alt when present', () => {
    expect(
      bindingToDisplayKeys({ code: 'KeyE', primaryMod: true, shift: true })
    ).toEqual(['Ctrl', 'Shift', 'E'])
  })

  it('omits primary modifier when not required', () => {
    expect(bindingToDisplayKeys({ code: 'Enter', primaryModRequired: false })).toEqual(['Enter'])
    expect(bindingToDisplayKeys({ code: 'Escape', primaryModRequired: false })).toEqual(['Esc'])
  })

  it('maps special key codes', () => {
    expect(bindingToDisplayKeys({ code: 'Comma', primaryMod: true })).toEqual(['Ctrl', ','])
  })
})

describe('bindingFromKeyboardEvent', () => {
  it('returns null for tab and modifier-only keys', () => {
    expect(bindingFromKeyboardEvent(keyEvent('Tab'))).toBeNull()
    expect(bindingFromKeyboardEvent(keyEvent('ShiftLeft', { shiftKey: true }))).toBeNull()
  })

  it('captures primary modifier chords', () => {
    expect(bindingFromKeyboardEvent(keyEvent('KeyN', { ctrlKey: true }))).toEqual({
      code: 'KeyN',
      primaryMod: true
    })
  })

  it('captures shift in chords', () => {
    expect(
      bindingFromKeyboardEvent(keyEvent('KeyE', { ctrlKey: true, shiftKey: true }))
    ).toEqual({
      code: 'KeyE',
      primaryMod: true,
      shift: true
    })
  })

  it('marks Enter and Escape as modifier-free', () => {
    expect(bindingFromKeyboardEvent(keyEvent('Enter'))).toEqual({
      code: 'Enter',
      primaryModRequired: false
    })
    expect(bindingFromKeyboardEvent(keyEvent('Escape'))).toEqual({
      code: 'Escape',
      primaryModRequired: false
    })
  })
})

describe('resolveShortcutDefinition', () => {
  it('returns default definition without override', () => {
    const def = getShortcutDefinition('newChat')
    expect(resolveShortcutDefinition(def)).toEqual(def)
  })

  it('merges override binding and display keys', () => {
    const def = getShortcutDefinition('newChat')
    const override = { code: 'KeyM', primaryMod: true }
    expect(resolveShortcutDefinition(def, override)).toEqual({
      ...def,
      binding: override,
      displayKeys: ['Ctrl', 'M']
    })
  })
})

describe('getResolvedShortcut', () => {
  beforeEach(() => {
    useSettingsStore.setState({ keyboardShortcutOverrides: {} })
  })

  it('reads overrides from settings store', () => {
    useSettingsStore.setState({
      keyboardShortcutOverrides: {
        newChat: { code: 'KeyM', primaryMod: true }
      }
    })
    expect(getResolvedShortcut('newChat').binding).toEqual({
      code: 'KeyM',
      primaryMod: true
    })
  })
})

describe('findShortcutConflict', () => {
  beforeEach(() => {
    useSettingsStore.setState({ keyboardShortcutOverrides: {} })
  })

  it('returns null when binding is unique', () => {
    expect(
      findShortcutConflict('newChat', { code: 'KeyZ', primaryMod: true })
    ).toBeNull()
  })

  it('detects conflicts with other shortcuts', () => {
    expect(
      findShortcutConflict('newChat', { code: 'KeyK', primaryMod: true })
    ).toBe('chatSearch')
  })

  it('allows shared chat/settings search binding', () => {
    expect(
      findShortcutConflict('chatSearch', { code: 'KeyK', primaryMod: true })
    ).toBeNull()
  })

  it('ignores self when checking conflicts', () => {
    const binding = getShortcutDefinition('newChat').binding
    expect(findShortcutConflict('newChat', binding)).toBeNull()
  })
})

describe('bindingsEqual', () => {
  it('compares all binding fields', () => {
    expect(
      bindingsEqual(
        { code: 'KeyN', primaryMod: true },
        { code: 'KeyN', primaryMod: true }
      )
    ).toBe(true)
    expect(
      bindingsEqual(
        { code: 'KeyN', primaryMod: true },
        { code: 'KeyN', primaryMod: true, shift: true }
      )
    ).toBe(false)
    expect(
      bindingsEqual(
        { code: 'Enter', primaryModRequired: false },
        { code: 'Enter', primaryModRequired: false }
      )
    ).toBe(true)
  })
})
