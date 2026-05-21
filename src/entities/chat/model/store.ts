import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { chatPersistStorage } from '@/entities/chat/lib/chat-persist-storage'
import {
  EMPTY_COMPOSER_ATTACHMENTS,
  type MessageAttachment
} from '@/entities/message/model/attachment'
import type { Message } from '@/entities/message/model/types'
import { notifyActiveChatChange } from '@/entities/chat/model/active-chat-effects'
import { sortChatsForSidebar } from '@/shared/lib/chat-sidebar'
import { useSettingsStore } from '@/entities/settings/model/store'
import type { Chat } from './types'

/** Stable empty reference for Zustand selectors. */
export const EMPTY_CHAT_HISTORY: readonly string[] = []

interface ChatsState {
  chats: Chat[]
  activeChatId: string | null
  composerDraftByChatId: Record<string, string>
  composerAttachmentsByChatId: Record<string, MessageAttachment[]>
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
  setChatUnreadReply: (id: string, hasUnreadReply: boolean) => void
  /** Mark unread when the user is not viewing this chat on the main screen. */
  notifyChatReplyReady: (chatId: string) => void
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>, targetChatId?: string) => string
  removeMessagesFrom: (messageId: string, targetChatId?: string) => void
  /** Keeps the message with `messageId` and removes everything after it. */
  removeMessagesAfter: (messageId: string, targetChatId?: string) => void
  updateUserMessageContent: (
    messageId: string,
    content: string,
    attachments?: MessageAttachment[]
  ) => void
  updateMessageContent: (
    messageId: string,
    content: string,
    targetChatId?: string,
    options?: { allowEmptyUser?: boolean; attachments?: MessageAttachment[] }
  ) => void
  getComposerDraft: (chatId: string) => string
  setComposerDraft: (chatId: string, draft: string) => void
  getComposerAttachments: (chatId: string) => MessageAttachment[]
  addComposerAttachments: (chatId: string, items: MessageAttachment[]) => void
  removeComposerAttachment: (chatId: string, attachmentId: string) => void
  clearComposerAttachments: (chatId: string) => void
  setChatScrollAnchor: (
    chatId: string,
    userMessageId: string | null,
    scrollTop?: number | null
  ) => void
  setChatMessages: (chatId: string, messages: Message[]) => void
  getActiveChat: () => Chat | null
  ensureActiveChat: () => string
  resortChats: () => void
  resetChats: () => void
}

type PersistedChatsState = Pick<
  ChatsState,
  | 'chats'
  | 'activeChatId'
  | 'composerDraftByChatId'
  | 'composerAttachmentsByChatId'
  | 'chatHistoryPast'
  | 'chatHistoryFuture'
>

/** Persist chats as-is; attachment blobs live in IndexedDB (`lingo-att:` refs). */
function chatsForPersist(chats: Chat[]): Chat[] {
  return chats
}

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

function normalizePersistedState(
  state: Partial<PersistedChatsState> & { composerAttachmentsByChatId?: unknown }
): PersistedChatsState {
  return {
    chats: state.chats ?? [],
    activeChatId: state.activeChatId ?? null,
    composerDraftByChatId: state.composerDraftByChatId ?? {},
    composerAttachmentsByChatId:
      (state.composerAttachmentsByChatId as Record<string, MessageAttachment[]>) ?? {},
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
      composerAttachmentsByChatId: {},
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
            chatHistoryFuture: [],
            chats: state.chats.map((c) =>
              c.id === id ? { ...c, hasUnreadReply: false } : c
            )
          }
        })
        notifyActiveChatChange()
      },

      setChatUnreadReply: (id, hasUnreadReply) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === id ? { ...c, hasUnreadReply } : c
          )
        }))
      },

      notifyChatReplyReady: (chatId) => {
        const onSettings = window.location.hash.startsWith('#/settings')
        const active = get().activeChatId
        if (!onSettings && active === chatId) {
          get().setChatUnreadReply(chatId, false)
          return
        }
        get().setChatUnreadReply(chatId, true)
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
            : state.chatHistoryFuture,
          chats: state.chats.map((c) =>
            c.id === previousId ? { ...c, hasUnreadReply: false } : c
          )
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
            : state.chatHistoryPast,
          chats: state.chats.map((c) =>
            c.id === nextId ? { ...c, hasUnreadReply: false } : c
          )
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
                  isFirstUser &&
                  (message.content.trim() || (message.attachments?.[0]?.name ?? ''))
                    ? titleFromMessage(
                        message.content.trim() ||
                          message.attachments?.[0]?.name ||
                          'Attachment'
                      )
                    : c.title,
                updatedAt: Date.now()
              }
            })
          )
        }))

        return fullMessage.id
      },

      removeMessagesFrom: (messageId, targetChatId) => {
        const chatId = targetChatId ?? get().activeChatId
        if (!chatId) return

        set((state) => ({
          chats: withSortedChats(
            state.chats.map((c) => {
              if (c.id !== chatId) return c
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

      removeMessagesAfter: (messageId, targetChatId) => {
        const chatId = targetChatId ?? get().activeChatId
        if (!chatId) return

        set((state) => ({
          chats: withSortedChats(
            state.chats.map((c) => {
              if (c.id !== chatId) return c
              const index = c.messages.findIndex((m) => m.id === messageId)
              if (index === -1) return c
              return {
                ...c,
                messages: c.messages.slice(0, index + 1),
                updatedAt: Date.now()
              }
            })
          )
        }))
      },

      updateUserMessageContent: (messageId, content, attachments) => {
        get().updateMessageContent(messageId, content, undefined, { attachments })
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
              const nextAttachments =
                options?.attachments !== undefined ? options.attachments : message.attachments
              const hasAttachments = (nextAttachments?.length ?? 0) > 0
              if (
                message.role === 'user' &&
                !trimmed &&
                !hasAttachments &&
                !options?.allowEmptyUser
              ) {
                return c
              }
              const nextContent = message.role === 'user' ? content : content
              const isFirstUser =
                message.role === 'user' &&
                index === 0 &&
                chatNeedsTitleFromFirstUser(c.title)
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id !== messageId) return m
                  const next = { ...m, content: nextContent }
                  if (options?.attachments !== undefined) {
                    next.attachments =
                      options.attachments.length > 0 ? options.attachments : undefined
                  }
                  return next
                }),
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

      getComposerAttachments: (chatId) =>
        get().composerAttachmentsByChatId[chatId] ?? EMPTY_COMPOSER_ATTACHMENTS,

      addComposerAttachments: (chatId, items) => {
        if (items.length === 0) return
        set((state) => ({
          composerAttachmentsByChatId: {
            ...state.composerAttachmentsByChatId,
            [chatId]: [...(state.composerAttachmentsByChatId[chatId] ?? []), ...items]
          }
        }))
      },

      removeComposerAttachment: (chatId, attachmentId) => {
        set((state) => {
          const list = state.composerAttachmentsByChatId[chatId] ?? []
          const next = list.filter((a) => a.id !== attachmentId)
          const composerAttachmentsByChatId = { ...state.composerAttachmentsByChatId }
          if (next.length === 0) delete composerAttachmentsByChatId[chatId]
          else composerAttachmentsByChatId[chatId] = next
          return { composerAttachmentsByChatId }
        })
      },

      setChatScrollAnchor: (chatId, userMessageId, scrollTop) => {
        set((state) => {
          const chat = state.chats.find((c) => c.id === chatId)
          if (!chat) return state

          const nextScrollTop =
            scrollTop != null && scrollTop > 0 ? Math.round(scrollTop) : undefined

          if (userMessageId == null) {
            if (
              chat.scrollAnchorUserMessageId == null &&
              chat.scrollAnchorScrollTop == null
            ) {
              return state
            }
          } else if (
            chat.scrollAnchorUserMessageId === userMessageId &&
            chat.scrollAnchorScrollTop === nextScrollTop
          ) {
            return state
          }

          return {
            chats: state.chats.map((c) => {
              if (c.id !== chatId) return c
              if (userMessageId == null) {
                return {
                  ...c,
                  scrollAnchorUserMessageId: undefined,
                  scrollAnchorScrollTop: undefined
                }
              }
              return {
                ...c,
                scrollAnchorUserMessageId: userMessageId,
                scrollAnchorScrollTop: nextScrollTop
              }
            })
          }
        })
      },

      clearComposerAttachments: (chatId) => {
        set((state) => {
          if (!state.composerAttachmentsByChatId[chatId]) return state
          const composerAttachmentsByChatId = { ...state.composerAttachmentsByChatId }
          delete composerAttachmentsByChatId[chatId]
          return { composerAttachmentsByChatId }
        })
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
      },

      resetChats: () => {
        set({
          chats: [],
          activeChatId: null,
          composerDraftByChatId: {},
          composerAttachmentsByChatId: {},
          chatHistoryPast: [],
          chatHistoryFuture: []
        })
        notifyActiveChatChange()
      }
    }),
    {
      name: 'lingo-chats-v3',
      storage: createJSONStorage(() => chatPersistStorage),
      version: 3,
      partialize: (state): PersistedChatsState => ({
        chats: chatsForPersist(state.chats),
        activeChatId: state.activeChatId,
        composerDraftByChatId: state.composerDraftByChatId,
        composerAttachmentsByChatId: state.composerAttachmentsByChatId,
        chatHistoryPast: state.chatHistoryPast,
        chatHistoryFuture: state.chatHistoryFuture
      }),
      migrate: (persisted, version) => {
        const state = normalizePersistedState(
          persisted as Partial<PersistedChatsState> & { composerAttachmentsByChatId?: unknown }
        )
        if (version >= 3) return state
        return state
      },
      merge: (persisted, current) => ({
        ...current,
        ...normalizePersistedState(
          persisted as Partial<PersistedChatsState> & { composerAttachmentsByChatId?: unknown }
        )
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.composerDraftByChatId = state.composerDraftByChatId ?? {}
          state.composerAttachmentsByChatId = state.composerAttachmentsByChatId ?? {}
          state.chatHistoryPast = state.chatHistoryPast ?? []
          state.chatHistoryFuture = state.chatHistoryFuture ?? []
        }
        state?.ensureActiveChat()
      }
    }
  )
)
