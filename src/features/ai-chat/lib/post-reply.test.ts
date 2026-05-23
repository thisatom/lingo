import { describe, expect, it } from 'vitest'
import {
  isPlaybackOnlyConversationError,
  notViewingPostReplyAction
} from './post-reply'

describe('post-reply', () => {
  it('treats TTS playback errors as non-rollback', () => {
    expect(
      isPlaybackOnlyConversationError(
        'Could not play audio. The assistant reply is shown in the chat.'
      )
    ).toBe(true)
    expect(
      isPlaybackOnlyConversationError(
        'Speech synthesis returned no audio. The text reply is still in the chat.'
      )
    ).toBe(true)
    expect(isPlaybackOnlyConversationError('Request failed')).toBe(false)
    expect(isPlaybackOnlyConversationError(null)).toBe(false)
  })

  it('processes queue in background when not viewing and queue non-empty', () => {
    expect(notViewingPostReplyAction(true)).toBe('process-queue')
    expect(notViewingPostReplyAction(false)).toBe('idle')
  })
})
