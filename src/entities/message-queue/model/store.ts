import { create } from 'zustand'
import type { MessageAttachment } from '@/entities/message/model/attachment'

export type QueuedMessage = {
  id: string
  content: string
  attachments?: MessageAttachment[]
}

/** Stable empty reference for selectors (avoids useSyncExternalStore infinite loops). */
export const EMPTY_MESSAGE_QUEUE: readonly QueuedMessage[] = []

function newQueuedId(): string {
  return `queued-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

interface MessageQueueState {
  byChatId: Record<string, QueuedMessage[]>
  getQueue: (chatId: string) => QueuedMessage[]
  enqueue: (chatId: string, content: string, attachments?: MessageAttachment[]) => QueuedMessage
  update: (chatId: string, id: string, content: string, attachments?: MessageAttachment[]) => void
  remove: (chatId: string, id: string) => void
  dequeue: (chatId: string) => QueuedMessage | undefined
  clearChat: (chatId: string) => void
}

export const useMessageQueueStore = create<MessageQueueState>((set, get) => ({
  byChatId: {},

  getQueue: (chatId) => get().byChatId[chatId] ?? EMPTY_MESSAGE_QUEUE,

  enqueue: (chatId, content, attachments) => {
    const item: QueuedMessage = {
      id: newQueuedId(),
      content: content.trim(),
      attachments: attachments?.length ? [...attachments] : undefined
    }
    set((state) => ({
      byChatId: {
        ...state.byChatId,
        [chatId]: [...(state.byChatId[chatId] ?? []), item]
      }
    }))
    return item
  },

  update: (chatId, id, content, attachments) => {
    set((state) => {
      const list = state.byChatId[chatId]
      if (!list?.length) return state
      return {
        byChatId: {
          ...state.byChatId,
          [chatId]: list.map((m) => {
            if (m.id !== id) return m
            const next: QueuedMessage = { ...m, content: content.trim() }
            if (attachments !== undefined) {
              next.attachments = attachments.length ? [...attachments] : undefined
            }
            return next
          })
        }
      }
    })
  },

  remove: (chatId, id) => {
    set((state) => {
      const list = state.byChatId[chatId]
      if (!list?.length) return state
      const next = list.filter((m) => m.id !== id)
      const byChatId = { ...state.byChatId }
      if (next.length === 0) delete byChatId[chatId]
      else byChatId[chatId] = next
      return { byChatId }
    })
  },

  dequeue: (chatId) => {
    const list = get().byChatId[chatId]
    if (!list?.length) return undefined
    const [first, ...rest] = list
    set((state) => {
      const byChatId = { ...state.byChatId }
      if (rest.length === 0) delete byChatId[chatId]
      else byChatId[chatId] = rest
      return { byChatId }
    })
    return first
  },

  clearChat: (chatId) => {
    set((state) => {
      if (!state.byChatId[chatId]) return state
      const byChatId = { ...state.byChatId }
      delete byChatId[chatId]
      return { byChatId }
    })
  }
}))
