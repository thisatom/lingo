import { describe, expect, it } from 'vitest'
import { resolveComposerPlaceholder } from './composer-placeholder'

describe('resolveComposerPlaceholder', () => {
  it('uses blocked reason when LLM is not ready', () => {
    expect(
      resolveComposerPlaceholder({
        llmReady: false,
        blockedReason: 'Add API key in Settings…',
        chatComposerMode: 'text',
        liveConversationActive: false,
        isListening: false,
        hasAttachments: false,
        agentBusy: false
      })
    ).toBe('Add API key in Settings…')
  })

  it('uses Agent Speech copy in conversation mode', () => {
    expect(
      resolveComposerPlaceholder({
        llmReady: true,
        blockedReason: null,
        chatComposerMode: 'conversation',
        liveConversationActive: false,
        isListening: false,
        hasAttachments: false,
        agentBusy: false
      })
    ).toBe('Tap mic for Agent Speech, or type a message…')
  })

  it('shows listening copy while recording', () => {
    expect(
      resolveComposerPlaceholder({
        llmReady: true,
        blockedReason: null,
        chatComposerMode: 'conversation',
        liveConversationActive: true,
        isListening: true,
        hasAttachments: false,
        agentBusy: false
      })
    ).toBe('Listening…')
  })
})
