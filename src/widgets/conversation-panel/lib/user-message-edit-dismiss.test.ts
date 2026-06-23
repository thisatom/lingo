import { describe, expect, it } from 'vitest'
import { shouldDismissUserMessageEdit } from './user-message-edit-dismiss'

function mockTarget(selectors: string[]): EventTarget {
  return {
    closest(selector: string) {
      return selectors.includes(selector) ? ({} as Element) : null
    }
  } as unknown as Element
}

describe('shouldDismissUserMessageEdit', () => {
  it('ignores clicks inside edit shell', () => {
    expect(shouldDismissUserMessageEdit(mockTarget(['[data-user-message-edit]']))).toBe(false)
  })

  it('ignores clicks on portaled context menu', () => {
    expect(shouldDismissUserMessageEdit(mockTarget(['[data-slot="context-menu-content"]']))).toBe(
      false
    )
  })

  it('dismisses clicks elsewhere', () => {
    expect(shouldDismissUserMessageEdit(mockTarget([]))).toBe(true)
  })

  it('ignores non-element targets', () => {
    expect(shouldDismissUserMessageEdit(null)).toBe(false)
  })
})
