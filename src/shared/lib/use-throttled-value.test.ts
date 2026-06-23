/**
 * @vitest-environment happy-dom
 */
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStreamMarkdownValue, useThrottledValue } from './use-throttled-value'

function renderHook<T>(render: () => T): { result: { current: T }; rerender: () => void; root: Root } {
  const result = { current: undefined as T }
  const container = document.createElement('div')

  function HookHost() {
    result.current = render()
    return null
  }

  const root = createRoot(container)
  act(() => {
    root.render(createElement(HookHost))
  })

  return {
    result,
    rerender: () => {
      act(() => {
        root.render(createElement(HookHost))
      })
    },
    root
  }
}

describe('useThrottledValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the latest value immediately when throttling is disabled', () => {
    const { result, root } = renderHook(() => useThrottledValue('alpha', 80, false))
    expect(result.current).toBe('alpha')
    root.unmount()
  })

  it('commits at most once per interval while streaming', () => {
    let value = 'a'
    const { result, rerender, root } = renderHook(() => useThrottledValue(value, 80, true))
    expect(result.current).toBe('a')

    value = 'abc'
    rerender()
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(80)
    })
    rerender()
    expect(result.current).toBe('abc')
    root.unmount()
  })
})

describe('useStreamMarkdownValue', () => {
  it('returns source immediately when streaming throttle is disabled', () => {
    const { result, root } = renderHook(() => useStreamMarkdownValue('hello', false, 80))
    expect(result.current).toBe('hello')
    root.unmount()
  })
})
