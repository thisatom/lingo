import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message } from '@/entities/message/model/types'
import { notifyActiveChatChange } from '@/entities/chat/model/active-chat-effects'
import { sortChatsForSidebar } from '@/shared/lib/chat-sidebar'
import { useSettingsStore } from '@/entities/settings/model/store'
import type { Chat } from './types'

interface ChatsState {
  chats: Chat[]
  activeChatId: string | null
  composerDraftByChatId: Record<string, string>
  chatHistoryPast: string[]
  chatHistoryFuture: string[]
  createChat: () => string
  forkChat: (sourceChatId: string) => string
  selectChat: (id: string) => void
  goBackInChatHistory: () => void
  goForwardInChatHistory: () => void
  deleteChat: (id: string) => void
  renameChat: (id: string, title: string) => void
  togglePinChat: (id: string) => void
  setChatHasError: (id: string, hasError: boolean) => void
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>, targetChatId?: string) => string
  removeMessagesFrom: (messageId: string) => void
  updateUserMessageContent: (messageId: string, content: string) => void
  updateMessageContent: (
    messageId: string,
    content: string,
    targetChatId?: string,
    options?: { allowEmptyUser?: boolean }
  ) => void
  getComposerDraft: (chatId: string) => string
  setComposerDraft: (chatId: string, draft: string) => void
  setChatMessages: (chatId: string, messages: Message[]) => void
  getActiveChat: () => Chat | null
  ensureActiveChat: () => string
  resortChats: () => void
}

type PersistedChatsState = Pick<
  ChatsState,
  'chats' | 'activeChatId' | 'composerDraftByChatId' | 'chatHistoryPast' | 'chatHistoryFuture'
>

function newMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function newChat(): Chat {
  const now = Date.now()
  return {
    id: `chat-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'New chat',
    messages: [],
    createdAt: now,
    updatedAt: now
  }
}

function titleFromMessage(content: string): string {
  const trimmed = content.trim()
  if (!trimmed) return 'New chat'
  if (trimmed.length <= 40) return trimmed
  return `${trimmed.slice(0, 40)}…`
}

function chatNeedsTitleFromFirstUser(title: string): boolean {
  const t = title.trim()
  return t === '' || t === 'New chat'
}

function withSortedChats(chats: Chat[]): Chat[] {
  const sort = useSettingsStore.getState().sidebarChatSort
  return sortChatsForSidebar(chats, sort)
}

function normalizePersistedState(state: PersistedChatsState): PersistedChatsState {
  return {
    chats: state.chats ?? [],
    activeChatId: state.activeChatId ?? null,
    composerDraftByChatId: state.composerDraftByChatId ?? {},
    chatHistoryPast: state.chatHistoryPast ?? [],
    chatHistoryFuture: state.chatHistoryFuture ?? []
  }
}

export const useChatsStore = create<ChatsState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      composerDraftByChatId: {},
      chatHistoryPast: [],
      chatHistoryFuture: [],

      createChat: () => {
        const chat = newChat()
        set((state) => {
          const chatHistoryPast = state.activeChatId
            ? [...(state.chatHistoryPast ?? []), state.activeChatId]
            : (state.chatHistoryPast ?? [])
          return {
            chats: withSortedChats([chat, ...state.chats]),
            activeChatId: chat.id,
            chatHistoryPast,
            chatHistoryFuture: []
          }
        })
        notifyActiveChatChange()
        return chat.id
      },

      forkChat: (sourceChatId) => {
        const source = get().chats.find((c) => c.id === sourceChatId)
        if (!source) return get().createChat()

        const now = Date.now()
        const forked: Chat = {
          id: `chat-${now}-${Math.random().toString(36).slice(2, 8)}`,
          title:
            source.title.trim() === '' || source.title === 'New chat'
              ? 'New chat'
              : `${source.title} (fork)`,
          messages: source.messages.map((message) => ({
            ...message,
            id: newMessageId(),
            createdAt: now
          })),
          createdAt: now,
          updatedAt: now
        }

        set((state) => {
          const chatHistoryPast = state.activeChatId
            ? [...(state.chatHistoryPast ?? []), state.activeChatId]
            : (state.chatHistoryPast ?? [])
          return {
            chats: withSortedChats([forked, ...state.chats]),
            activeChatId: forked.id,
            chatHistoryPast,
            chatHistoryFuture: []
          }
        })
        notifyActiveChatChange()
        return forked.id
      },

      selectChat: (id) => {
        if (!get().chats.some((c) => c.id === id)) return
        const prev = get().activeChatId
        if (prev === id) return

        set((state) => {
          const chatHistoryPast =
            state.activeChatId && state.activeChatId !== id
              ? [...state.chatHistoryPast, state.activeChatId]
              : state.chatHistoryPast
          return {
            activeChatId: id,
            chatHistoryPast,
            chatHistoryFuture: []
          }
        })
        notifyActiveChatChange()
      },

      goBackInChatHistory: () => {
        const { chatHistoryPast, activeChatId } = get()
        if (chatHistoryPast.length === 0) return
        const previousId = chatHistoryPast[chatHistoryPast.length - 1]
        if (!get().chats.some((c) => c.id === previousId)) {
          set({ chatHistoryPast: chatHistoryPast.slice(0, -1) })
          return
        }
        if (activeChatId === previousId) return

        set((state) => ({
          activeChatId: previousId,
          chatHistoryPast: state.chatHistoryPast.slice(0, -1),
          chatHistoryFuture: activeChatId
            ? [activeChatId, ...state.chatHistoryFuture]
            : state.chatHistoryFuture
        }))
        notifyActiveChatChange()
      },

      goForwardInChatHistory: () => {
        const { chatHistoryFuture, activeChatId } = get()
        if (chatHistoryFuture.length === 0) return
        const nextId = chatHistoryFuture[0]
        if (!get().chats.some((c) => c.id === nextId)) {
          set({ chatHistoryFuture: chatHistoryFuture.slice(1) })
          return
        }
        if (activeChatId === nextId) return

        set((state) => ({
          activeChatId: nextId,
          chatHistoryFuture: state.chatHistoryFuture.slice(1),
          chatHistoryPast: activeChatId
            ? [...state.chatHistoryPast, activeChatId]
            : state.chatHistoryPast
        }))
        notifyActiveChatChange()
      },

      deleteChat: (id) => {
        const prevActive = get().activeChatId
        set((state) => {
          const drafts = state.composerDraftByChatId ?? {}
          const { [id]: _removed, ...composerDraftByChatId } = drafts
          const chats = state.chats.filter((c) => c.id !== id)
          let activeChatId = state.activeChatId
          if (activeChatId === id) {
            activeChatId = chats[0]?.id ?? null
          }
          const chatHistoryPast = (state.chatHistoryPast ?? []).filter(
            (chatId) => chatId !== id
          )
          const chatHistoryFuture = (state.chatHistoryFuture ?? []).filter(
            (chatId) => chatId !== id
          )
          if (chats.length === 0) {
            const chat = newChat()
            return {
              chats: [chat],
              activeChatId: chat.id,
              composerDraftByChatId,
              chatHistoryPast: [],
              chatHistoryFuture: []
            }
          }
          return {
            chats: withSortedChats(chats),
            activeChatId,
            composerDraftByChatId,
            chatHistoryPast,
            chatHistoryFuture
          }
        })
        if (get().activeChatId !== prevActive) {
          notifyActiveChatChange()
        }
      },

      setChatHasError: (id, hasError) => {
        set((state) => ({
          chats: state.chats.map((c) => (c.id === id ? { ...c, hasError } : c))
        }))
      },

      togglePinChat: (id) => {
        set((state) => ({
          chats: withSortedChats(
            state.chats.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
          )
        }))
      },

      renameChat: (id, title) => {
        const trimmed = title.trim()
        if (!trimmed) return
        set((state) => ({
          chats: withSortedChats(
            state.chats.map((c) =>
              c.id === id ? { ...c, title: trimmed, updatedAt: Date.now() } : c
            )
          )
        }))
      },

      addMessage: (message, targetChatId) => {
        const chatId = targetChatId ?? get().activeChatId ?? get().ensureActiveChat()
        if (!get().chats.some((c) => c.id === chatId)) {
          return ''
        }

        const fullMessage: Message = {
          ...message,
          id: newMessageId(),
          createdAt: Date.now()
        }

        set((state) => ({
          chats: withSortedChats(
            state.chats.map((c) => {
              if (c.id !== chatId) return c
              const isFirstUser =
                message.role === 'user' &&
                c.messages.length === 0 &&
                chatNeedsTitleFromFirstUser(c.title)
              return {
                ...c,
                messages: [...c.messages, fullMessage],
                title:
                  isFirstUser && message.content.trim()
                    ? titleFromMessage(message.content)
                    : c.title,
                updatedAt: Date.now()
              }
            })
          )
        }))

        return fullMessage.id
      },

      removeMessagesFrom: (messageId) => {
        const activeId = get().activeChatId
        if (!activeId) return

        set((state) => ({
          chats: withSortedChats(
            state.chats.map((c) => {
              if (c.id !== activeId) return c
              const index = c.messages.findIndex((m) => m.id === messageId)
              if (index === -1) return c
              return {
                ...c,
                messages: c.messages.slice(0, index),
                updatedAt: Date.now()
              }
            })
          )
        }))
      },

      updateUserMessageContent: (messageId, content) => {
        get().updateMessageContent(messageId, content)
      },

      updateMessageContent: (messageId, content, targetChatId, options) => {
        const chatId = targetChatId ?? get().activeChatId
        if (!chatId) return

        set((state) => ({
          chats: withSortedChats(
            state.chats.map((c) => {
              if (c.id !== chatId) return c
              const index = c.messages.findIndex((m) => m.id === messageId)
              if (index === -1) return c
              const message = c.messages[index]
              const trimmed = message.role === 'user' ? content.trim() : content
              if (message.role === 'user' && !trimmed && !options?.allowEmptyUser) return c
              const nextContent = message.role === 'user' ? content : content
              const isFirstUser =
                message.role === 'user' &&
                index === 0 &&
                chatNeedsTitleFromFirstUser(c.title)
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId ? { ...m, content: nextContent } : m
                ),
                title:
                  isFirstUser && trimmed
                    ? titleFromMessage(trimmed)
                    : c.title,
                updatedAt: Date.now()
              }
            })
          )
        }))
      },

      getComposerDraft: (chatId) => get().composerDraftByChatId?.[chatId] ?? '',

      setComposerDraft: (chatId, draft) => {
        set((state) => ({
          composerDraftByChatId: {
            ...(state.composerDraftByChatId ?? {}),
            [chatId]: draft
          }
        }))
      },

      setChatMessages: (chatId, messages) => {
        if (!get().chats.some((c) => c.id === chatId)) return

        set((state) => ({
          chats: withSortedChats(
            state.chats.map((c) =>
              c.id === chatId ? { ...c, messages, updatedAt: Date.now() } : c
            )
          )
        }))
      },

      getActiveChat: () => {
        const { chats, activeChatId } = get()
        return chats.find((c) => c.id === activeChatId) ?? null
      },

      ensureActiveChat: () => {
        const { chats, activeChatId } = get()
        if (activeChatId && chats.some((c) => c.id === activeChatId)) {
          return activeChatId
        }
        if (chats.length > 0) {
          const id = chats[0].id
          set({ activeChatId: id })
          return id
        }
        return get().createChat()
      },

      resortChats: () => {
        set((state) => ({
          chats: withSortedChats(state.chats)
        }))
      }
    }),
    {
      name: 'lingo-chats',
      version: 1,
      migrate: (persisted) => normalizePersistedState(persisted as PersistedChatsState),
      merge: (persisted, current) => ({
        ...current,
        ...normalizePersistedState(persisted as PersistedChatsState)
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.composerDraftByChatId = state.composerDraftByChatId ?? {}
          state.chatHistoryPast = state.chatHistoryPast ?? []
          state.chatHistoryFuture = state.chatHistoryFuture ?? []
        }
        state?.ensureActiveChat()
      }
    }
  )
)
