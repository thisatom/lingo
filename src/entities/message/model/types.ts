import type { MessageAttachment } from './attachment'

export type MessageRole = 'user' | 'assistant' | 'thinking'

/** Set when the assistant reply was stopped or failed before finishing. */
export type MessageReplyStatus = 'interrupted' | 'incomplete'

export type MessageSearchSource = {
  title: string
  url: string
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: number
  attachments?: MessageAttachment[]
  /** Web pages used for this assistant reply. */
  searchSources?: MessageSearchSource[]
  /** Omitted when the reply finished normally. */
  replyStatus?: MessageReplyStatus
}

/** Stable empty reference for Zustand selectors. */
export const EMPTY_MESSAGES: readonly Message[] = []
