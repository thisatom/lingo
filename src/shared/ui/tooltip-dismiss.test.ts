import { describe, expect, it, vi } from 'vitest'
import { dismissAllTooltips, registerTooltipDismissHandler } from '@/shared/ui/tooltip-dismiss'

describe('tooltip dismiss registry', () => {
  it('calls registered handlers once', () => {
    const close = vi.fn()
    const unregister = registerTooltipDismissHandler(close)
    dismissAllTooltips()
    expect(close).toHaveBeenCalledOnce()
    unregister()
  })

  it('does not recurse when a handler triggers another dismiss', () => {
    let nested = 0
    registerTooltipDismissHandler(() => {
      nested += 1
      dismissAllTooltips()
    })
    dismissAllTooltips()
    expect(nested).toBe(1)
  })
})
