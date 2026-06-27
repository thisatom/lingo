import { describe, expect, it } from 'vitest'
import { isReplyActionsReady } from './reply-actions-ready'

describe('isReplyActionsReady', () => {
  it('waits while answer text is streaming', () => {
    expect(
      isReplyActionsReady({
        agentBusy: true,
        pipelineStreamingAnswer: true,
        stage: 'thinking'
      })
    ).toBe(false)
  })

  it('waits while agent is busy after stream (TTS, reconnect, etc.)', () => {
    expect(
      isReplyActionsReady({
        agentBusy: true,
        pipelineStreamingAnswer: false,
        stage: 'speaking'
      })
    ).toBe(false)
  })

  it('shows when agent is idle', () => {
    expect(
      isReplyActionsReady({
        agentBusy: false,
        pipelineStreamingAnswer: false,
        stage: 'idle'
      })
    ).toBe(true)
  })
})
