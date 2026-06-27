/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest'
import {
  captureVirtualizationScrollAnchor,
  estimateTurnIdFromScrollTop,
  findTurnIndexByUserMessageId
} from './chat-scroll-anchor'

describe('chat-scroll-anchor virtualization helpers', () => {
  it('finds turn index by user message id', () => {
    const turns = [
      { user: { id: 'u1' } },
      { user: { id: 'u2' } }
    ]
    expect(findTurnIndexByUserMessageId(turns, 'u2')).toBe(1)
    expect(findTurnIndexByUserMessageId(turns, 'missing')).toBe(-1)
  })

  it('captures scrollTop and nearest visible turn id', () => {
    const viewport = document.createElement('div')
    Object.defineProperty(viewport, 'scrollTop', { value: 240, writable: true })
    viewport.getBoundingClientRect = () =>
      ({
        top: 0,
        left: 0,
        right: 400,
        bottom: 600,
        width: 400,
        height: 600
      }) as DOMRect

    const near = document.createElement('section')
    near.setAttribute('data-conversation-turn', '')
    near.setAttribute('data-turn-id', 'u-near')
    near.getBoundingClientRect = () =>
      ({ top: 4, left: 0, right: 400, bottom: 120, width: 400, height: 116 }) as DOMRect

    const far = document.createElement('section')
    far.setAttribute('data-conversation-turn', '')
    far.setAttribute('data-turn-id', 'u-far')
    far.getBoundingClientRect = () =>
      ({ top: 400, left: 0, right: 400, bottom: 520, width: 400, height: 120 }) as DOMRect

    viewport.append(near, far)

    expect(captureVirtualizationScrollAnchor(viewport)).toEqual({
      scrollTop: 240,
      turnId: 'u-near'
    })
  })

  it('estimates turn id from saved scroll position', () => {
    const turns = [{ user: { id: 'u1' } }, { user: { id: 'u2' } }, { user: { id: 'u3' } }]
    expect(estimateTurnIdFromScrollTop(turns, 0, 1000)).toBe('u1')
    expect(estimateTurnIdFromScrollTop(turns, 1000, 1000)).toBe('u3')
  })
})
