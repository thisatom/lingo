import type { Message } from '@/entities/message/model/types'

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  pinned?: boolean
  /** Last failed assistant request in this chat (sidebar red dot). */
  hasError?: boolean
  /** Assistant reply finished while this chat was in the background (sidebar blue dot). */
  hasUnreadReply?: boolean
  /** User message id at the top of the chat scroll viewport after reload. */
  scrollAnchorUserMessageId?: string | null
  /** Saved scrollTop (px) — restored when the turn anchor is not ready yet. */
  scrollAnchorScrollTop?: number | null
}
