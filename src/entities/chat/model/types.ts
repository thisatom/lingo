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
}
