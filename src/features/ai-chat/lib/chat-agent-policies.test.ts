import { describe, expect, it } from 'vitest'
import {
  resolveStreamDoneAnswer,
  shouldPlayAgentTts,
  shouldRemoveEmptyThinkingPlaceholder
} from './chat-agent-policies'

describe('chat-agent-policies', () => {
  describe('resolveStreamDoneAnswer', () => {
    it('prefers non-empty done text', () => {
      expect(resolveStreamDoneAnswer('Final.', 'Streamed')).toBe('Final.')
    })

    it('keeps streamed text when done is empty', () => {
      expect(resolveStreamDoneAnswer('', '  Streamed answer  ')).toBe('Streamed answer')
    })

    it('keeps merged streamed text when done is a continuation tail only', () => {
      expect(
        resolveStreamDoneAnswer(
          ' there was a kingdom.',
          'Once upon a time there was a kingdom.'
        )
      ).toBe('Once upon a time there was a kingdom.')
    })
  })

  describe('shouldRemoveEmptyThinkingPlaceholder', () => {
    it('removes only when answer started without thinking stream', () => {
      expect(shouldRemoveEmptyThinkingPlaceholder(false, true)).toBe(true)
      expect(shouldRemoveEmptyThinkingPlaceholder(true, true)).toBe(false)
      expect(shouldRemoveEmptyThinkingPlaceholder(false, false)).toBe(false)
    })
  })

  describe('shouldPlayAgentTts', () => {
    it('allows TTS only in conversation mode when enabled', () => {
      expect(shouldPlayAgentTts(true, 'conversation')).toBe(true)
      expect(shouldPlayAgentTts(true, 'text')).toBe(false)
      expect(shouldPlayAgentTts(false, 'conversation')).toBe(false)
    })
  })
})
