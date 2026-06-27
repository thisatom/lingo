import { describe, expect, it } from 'vitest'
import { resolveOpenRouterReadyState } from './useLlmChatReady'

describe('resolveOpenRouterReadyState', () => {
  it('blocks composer when OpenRouter key is missing', () => {
    expect(resolveOpenRouterReadyState({ isSet: false, provider: 'openrouter' }, false)).toEqual({
      ready: false,
      loading: false,
      blockedReason: 'Add API key in Settings…'
    })
  })

  it('stays ready while refreshing an existing key', () => {
    expect(resolveOpenRouterReadyState({ isSet: true, provider: 'openrouter' }, true)).toEqual({
      ready: true,
      loading: false,
      blockedReason: null
    })
  })
})
