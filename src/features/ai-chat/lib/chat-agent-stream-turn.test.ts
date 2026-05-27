import { describe, expect, it } from 'vitest'
import { applyDoneToTurn, applyTextDeltaToTurn } from './chat-agent-stream-turn'

describe('chat-agent-stream-turn', () => {
  describe('applyTextDeltaToTurn', () => {
    it('accumulates answer and keeps thinking when reasoning preceded answer', () => {
      const result = applyTextDeltaToTurn(
        {
          finalText: '',
          finalThinkingText: 'Let me think…',
          hasThinkingStream: true
        },
        'Hello there',
        true
      )

      expect(result.accumulators.finalText).toBe('Hello there')
      expect(result.removeThinkingPlaceholder).toBe(false)
      expect(result.flushThinkingNow).toBe(true)
      expect(result.pushAnswerToSync).toBe(true)
    })

    it('drops empty thinking placeholder when answer arrives without reasoning', () => {
      const result = applyTextDeltaToTurn(
        {
          finalText: '',
          finalThinkingText: '',
          hasThinkingStream: false
        },
        'Answer only',
        true
      )

      expect(result.removeThinkingPlaceholder).toBe(true)
      expect(result.flushThinkingNow).toBe(false)
    })
  })

  describe('applyDoneToTurn', () => {
    it('preserves streamed answer when done text is empty', () => {
      const result = applyDoneToTurn(
        {
          finalText: 'From deltas',
          finalThinkingText: '',
          hasThinkingStream: false
        },
        '',
        ''
      )

      expect(result.accumulators.finalText).toBe('From deltas')
      expect(result.flushAnswerText).toBe('From deltas')
    })

    it('recovers thinking from message content on done', () => {
      const result = applyDoneToTurn(
        {
          finalText: 'Answer',
          finalThinkingText: '',
          hasThinkingStream: false
        },
        'Answer',
        'Recovered reasoning'
      )

      expect(result.accumulators.hasThinkingStream).toBe(true)
      expect(result.accumulators.finalThinkingText).toBe('Recovered reasoning')
      expect(result.flushThinkingText).toBe('Recovered reasoning')
    })
  })
})
