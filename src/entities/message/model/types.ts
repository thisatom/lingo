import type { MessageAttachment } from './attachment'

export type MessageRole = 'user' | 'assistant' | 'thinking'

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: number
  attachments?: MessageAttachment[]
}

/** Stable empty reference for Zustand selectors. */
export const EMPTY_MESSAGES: readonly Message[] = []
