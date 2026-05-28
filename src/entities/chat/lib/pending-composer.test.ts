import { describe, expect, it } from 'vitest'
import {
  composerDraftSlotsForChat,
  omitPendingComposerFromRecord,
  PENDING_COMPOSER_CHAT_ID
} from '@/entities/chat/lib/pending-composer'

describe('pending-composer', () => {
  it('omitPendingComposerFromRecord removes the ephemeral slot', () => {
    const input = {
      [PENDING_COMPOSER_CHAT_ID]: 'draft',
      'chat-a': 'keep'
    }

    expect(omitPendingComposerFromRecord(input)).toEqual({ 'chat-a': 'keep' })
  })

  it('composerDraftSlotsForChat includes pending unless chat is pending', () => {
    expect(composerDraftSlotsForChat('chat-a')).toEqual([
      'chat-a',
      PENDING_COMPOSER_CHAT_ID
    ])
    expect(composerDraftSlotsForChat(PENDING_COMPOSER_CHAT_ID)).toEqual([
      PENDING_COMPOSER_CHAT_ID
    ])
  })
})
