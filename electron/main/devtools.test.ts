import { describe, expect, it } from 'vitest'
import { isDevToolsAccelerator } from './devtools'

function keyDown(partial: Partial<Electron.Input> & { code: string }): Electron.Input {
  return {
    type: 'keyDown',
    control: false,
    meta: false,
    shift: false,
    alt: false,
    ...partial
  } as Electron.Input
}

describe('isDevToolsAccelerator', () => {
  it('matches F12', () => {
    expect(isDevToolsAccelerator(keyDown({ code: 'F12' }))).toBe(true)
  })

  it('matches Ctrl+Shift+I', () => {
    expect(
      isDevToolsAccelerator(keyDown({ code: 'KeyI', control: true, shift: true }))
    ).toBe(true)
  })

  it('matches Meta+Shift+I', () => {
    expect(isDevToolsAccelerator(keyDown({ code: 'KeyI', meta: true, shift: true }))).toBe(true)
  })

  it('ignores plain I and Ctrl+I', () => {
    expect(isDevToolsAccelerator(keyDown({ code: 'KeyI' }))).toBe(false)
    expect(isDevToolsAccelerator(keyDown({ code: 'KeyI', control: true }))).toBe(false)
  })

  it('ignores keyUp', () => {
    expect(
      isDevToolsAccelerator({ ...keyDown({ code: 'F12' }), type: 'keyUp' } as Electron.Input)
    ).toBe(false)
  })
})
