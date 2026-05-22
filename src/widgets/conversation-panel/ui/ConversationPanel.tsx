import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AgentChatScrollArea } from './AgentChatScrollArea'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { Message } from '@/entities/message/model/types'
import { CHAT_SCROLL_MIN_PX } from '@/entities/chat/lib/chat-scroll-persist'
import { useChatsStore } from '@/entities/chat/model/store'
import type { PipelineStage } from '@/entities/conversation/model/store'
import { CHAT_COLUMN_MAX_WIDTH_CLASS } from '@/shared/lib/layout'
import { CHAT_BOTTOM_INSET } from '@/widgets/conversation-panel/lib/chat-layout'
import {
  applyScrollTop,
  scrollViewportToBottom
} from '@/widgets/conversation-panel/lib/chat-scroll-anchor'
import {
  recallChatScrollTop,
  rememberChatScrollTop
} from '@/widgets/conversation-panel/lib/chat-scroll-memory'
import {
  groupMessagesIntoTurns,
  messageHasVisibleContent
} from '@/widgets/conversation-panel/lib/group-turns'
import { cn } from '@/shared/lib/utils'
import { AgentStatus } from './AgentStatus'
import { ChatEmptyPrompt } from './ChatEmptyPrompt'
import { ConversationTurn } from './ConversationTurn'

const ACTIVE_STAGES: PipelineStage[] = [
  'listening',
  'transcribing',
  'thinking',
  'searching',
  'speaking'
]

const SCROLL_PERSIST_DEBOUNCE_MS = 120

interface ConversationPanelProps {
  messages: readonly Message[]
  stage: PipelineStage
  activeChatId: string | null
  actionsDisabled?: boolean
  onSubmitEditedUserMessage: (
    messageId: string,
    text: string,
    attachments?: MessageAttachment[]
  ) => void
  onAtBottomChange?: (atBottom: boolean) => void
  onShowScrollToLatestChange?: (show: boolean) => void
  onScrollToLatestReady?: (scrollToLatest: () => void) => void
  onAttachmentError?: (message: string) => void
}

function resolveSavedScrollTop(
  chatId: string,
  storedScrollTop: number | null | undefined
): number | null {
  const memory = recallChatScrollTop(chatId)
  if (memory != null && memory >= CHAT_SCROLL_MIN_PX) return memory
  if (storedScrollTop != null && storedScrollTop >= CHAT_SCROLL_MIN_PX) {
    return storedScrollTop
  }
  return null
}

export function ConversationPanel({
  messages,
  stage,
  activeChatId,
  actionsDisabled,
  onSubmitEditedUserMessage,
  onAtBottomChange,
  onShowScrollToLatestChange,
  onScrollToLatestReady,
  onAttachmentError
}: ConversationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const activeChatIdRef = useRef(activeChatId)
  activeChatIdRef.current = activeChatId

  const skipSaveRef = useRef(false)
  const scrollSaveEnabledRef = useRef(false)
  const isRestoringScrollRef = useRef(false)
  const scrollRestoreAttemptRef = useRef<string | null>(null)
  const scrollMemoryRafRef = useRef<number | null>(null)
  const persistIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPersistedScrollRef = useRef<{ chatId: string; scrollTop: number } | null>(null)

  const setChatScrollPosition = useChatsStore((s) => s.setChatScrollPosition)
  const clearChatScrollPosition = useChatsStore((s) => s.clearChatScrollPosition)
  const [chatsStoreHydrated, setChatsStoreHydrated] = useState(() =>
    useChatsStore.persist.hasHydrated()
  )
  const storedScrollTop = useChatsStore((s) => {
    if (!activeChatId || !chatsStoreHydrated) return null
    const top = s.chatScrollByChatId[activeChatId]
    return top ?? null
  })

  const [editingUserMessageId, setEditingUserMessageId] = useState<string | null>(null)
  const atBottomRef = useRef(true)
  const showStatus = ACTIVE_STAGES.includes(stage)

  const scrollToLatest = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const viewport = viewportRef.current
    if (viewport) {
      scrollViewportToBottom(viewport, behavior)
      return
    }
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' })
  }, [])

  const skipAutoScrollOnMountRef = useRef(true)
  const prevMessagesLengthRef = useRef(messages.length)
  const prevShowStatusRef = useRef(showStatus)

  const handleAtBottomChange = useCallback(
    (value: boolean) => {
      if (isRestoringScrollRef.current) return
      if (atBottomRef.current === value) return
      atBottomRef.current = value
      onAtBottomChange?.(value)
    },
    [onAtBottomChange]
  )

  const enableScrollSave = useCallback(() => {
    scrollSaveEnabledRef.current = true
  }, [])

  const persistScrollPosition = useCallback(
    (viewport: HTMLDivElement, chatId: string, force = false) => {
      if (
        !force &&
        (!scrollSaveEnabledRef.current || skipSaveRef.current || isRestoringScrollRef.current)
      ) {
        return
      }

      const scrollTop = Math.round(viewport.scrollTop)

      if (scrollTop < CHAT_SCROLL_MIN_PX) {
        rememberChatScrollTop(chatId, 0)
        lastPersistedScrollRef.current = null
        clearChatScrollPosition(chatId)
        return
      }

      const last = lastPersistedScrollRef.current
      if (last?.chatId === chatId && last.scrollTop === scrollTop) return

      lastPersistedScrollRef.current = { chatId, scrollTop }
      rememberChatScrollTop(chatId, scrollTop)
      setChatScrollPosition(chatId, scrollTop)
    },
    [clearChatScrollPosition, setChatScrollPosition]
  )

  const schedulePersistToStore = useCallback(
    (viewport: HTMLDivElement) => {
      const chatId = activeChatIdRef.current
      if (
        !chatId ||
        !scrollSaveEnabledRef.current ||
        skipSaveRef.current ||
        isRestoringScrollRef.current
      ) {
        return
      }

      if (persistIdleTimerRef.current != null) {
        clearTimeout(persistIdleTimerRef.current)
      }

      persistIdleTimerRef.current = setTimeout(() => {
        persistIdleTimerRef.current = null
        const id = activeChatIdRef.current
        if (!id || !viewportRef.current) return
        persistScrollPosition(viewport, id)
      }, SCROLL_PERSIST_DEBOUNCE_MS)
    },
    [persistScrollPosition]
  )

  const handleViewportScroll = useCallback(
    (viewport: HTMLDivElement) => {
      const chatId = activeChatIdRef.current
      if (!chatId || skipSaveRef.current || isRestoringScrollRef.current) return

      if (scrollMemoryRafRef.current != null) return
      scrollMemoryRafRef.current = requestAnimationFrame(() => {
        scrollMemoryRafRef.current = null
        const id = activeChatIdRef.current
        if (!id || skipSaveRef.current || isRestoringScrollRef.current) return
        if (viewport.scrollTop >= CHAT_SCROLL_MIN_PX) {
          rememberChatScrollTop(id, viewport.scrollTop)
        }
      })

      schedulePersistToStore(viewport)
    },
    [schedulePersistToStore]
  )

  const handleViewportRef = useCallback((el: HTMLDivElement | null) => {
    viewportRef.current = el
  }, [])

  const flushScrollPosition = useCallback(
    (force = false) => {
      if (persistIdleTimerRef.current != null) {
        clearTimeout(persistIdleTimerRef.current)
        persistIdleTimerRef.current = null
      }
      const viewport = viewportRef.current
      const chatId = activeChatIdRef.current
      if (viewport && chatId) persistScrollPosition(viewport, chatId, force)
    },
    [persistScrollPosition]
  )

  useEffect(() => {
    onScrollToLatestReady?.(() => scrollToLatest('smooth'))
  }, [onScrollToLatestReady, scrollToLatest])

  useEffect(() => {
    if (useChatsStore.persist.hasHydrated()) {
      setChatsStoreHydrated(true)
      return
    }
    return useChatsStore.persist.onFinishHydration(() => {
      setChatsStoreHydrated(true)
    })
  }, [])

  useEffect(() => {
    setEditingUserMessageId(null)
    skipAutoScrollOnMountRef.current = true
    scrollSaveEnabledRef.current = false
    scrollRestoreAttemptRef.current = null

    if (!activeChatId) {
      isRestoringScrollRef.current = false
      return
    }

    if (!chatsStoreHydrated) {
      isRestoringScrollRef.current = true
      return
    }

    const saved = resolveSavedScrollTop(activeChatId, storedScrollTop)
    isRestoringScrollRef.current = saved != null
    atBottomRef.current = saved == null
    onAtBottomChange?.(saved == null)

    if (saved == null) {
      enableScrollSave()
    }
  }, [activeChatId, chatsStoreHydrated, enableScrollSave, onAtBottomChange, storedScrollTop])

  useEffect(() => {
    const onPageHide = () => flushScrollPosition(true)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushScrollPosition(true)
    }

    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onPageHide)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('beforeunload', onPageHide)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (scrollMemoryRafRef.current != null) {
        cancelAnimationFrame(scrollMemoryRafRef.current)
      }
      if (persistIdleTimerRef.current != null) {
        clearTimeout(persistIdleTimerRef.current)
        persistIdleTimerRef.current = null
      }
      flushScrollPosition(true)
    }
  }, [flushScrollPosition])

  useEffect(() => {
    if (!editingUserMessageId) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (target instanceof Element && target.closest('[data-user-message-edit]')) return
      setEditingUserMessageId(null)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [editingUserMessageId])

  const turns = useMemo(() => groupMessagesIntoTurns(messages), [messages])
  const hasVisibleMessages = useMemo(
    () => messages.some(messageHasVisibleContent),
    [messages]
  )

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !activeChatId || !chatsStoreHydrated || turns.length === 0) return

    const savedScrollTop = resolveSavedScrollTop(activeChatId, storedScrollTop)
    const restoreKey = `${activeChatId}:${savedScrollTop ?? 'bottom'}:${turns.length}`
    if (scrollRestoreAttemptRef.current === restoreKey) return
    scrollRestoreAttemptRef.current = restoreKey

    if (savedScrollTop == null) {
      scrollToLatest('instant')
      isRestoringScrollRef.current = false
      skipAutoScrollOnMountRef.current = false
      enableScrollSave()
      return
    }

    isRestoringScrollRef.current = true
    skipSaveRef.current = true
    scrollSaveEnabledRef.current = false

    let cancelled = false
    let done = false

    const finishRestore = () => {
      if (done) return
      done = true
      isRestoringScrollRef.current = false
      atBottomRef.current = false
      onAtBottomChange?.(false)
      requestAnimationFrame(() => {
        skipSaveRef.current = false
        enableScrollSave()
      })
    }

    const attemptRestore = (): boolean => {
      if (cancelled || done) return true

      const { contentReady } = applyScrollTop(viewport, savedScrollTop)
      if (!contentReady) return false

      finishRestore()
      return true
    }

    if (attemptRestore()) {
      return () => {
        cancelled = true
      }
    }

    const content =
      viewport.querySelector('[data-chat-scroll-content]') ?? viewport.firstElementChild
    const observer = new ResizeObserver(() => {
      attemptRestore()
    })
    if (content) observer.observe(content)

    const raf1 = requestAnimationFrame(() => attemptRestore())
    const raf2 = requestAnimationFrame(() => {
      requestAnimationFrame(() => attemptRestore())
    })

    return () => {
      cancelled = true
      observer.disconnect()
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [
    activeChatId,
    chatsStoreHydrated,
    enableScrollSave,
    onAtBottomChange,
    scrollToLatest,
    storedScrollTop,
    turns.length
  ])

  useLayoutEffect(() => {
    if (skipAutoScrollOnMountRef.current) {
      skipAutoScrollOnMountRef.current = false
      prevMessagesLengthRef.current = messages.length
      prevShowStatusRef.current = showStatus
      return
    }

    if (!scrollSaveEnabledRef.current || isRestoringScrollRef.current) {
      prevMessagesLengthRef.current = messages.length
      prevShowStatusRef.current = showStatus
      return
    }

    if (!atBottomRef.current) {
      prevMessagesLengthRef.current = messages.length
      prevShowStatusRef.current = showStatus
      return
    }

    const messagesGrew = messages.length > prevMessagesLengthRef.current
    const statusAppeared = showStatus && !prevShowStatusRef.current
    prevMessagesLengthRef.current = messages.length
    prevShowStatusRef.current = showStatus

    if (!messagesGrew && !statusAppeared) return

    scrollToLatest('instant')
  }, [messages.length, showStatus, scrollToLatest])

  const showEmptyPrompt = !hasVisibleMessages && !showStatus

  return (
    <div className="absolute inset-0 overflow-hidden">
      {showEmptyPrompt ? (
        <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-4">
          <ChatEmptyPrompt className="w-full max-w-md" />
        </div>
      ) : null}

      <AgentChatScrollArea
        className="h-full min-h-0"
        onAtBottomChange={handleAtBottomChange}
        onShowScrollToLatestChange={onShowScrollToLatestChange}
        onViewportRef={handleViewportRef}
        onViewportScroll={handleViewportScroll}
      >
        <div
          className={cn('mx-auto px-4 pt-[18px] sm:px-6', CHAT_COLUMN_MAX_WIDTH_CLASS)}
        >
          <div
            data-chat-scroll-content
            className={cn('relative', turns.length > 0 && 'space-y-5')}
            style={{ paddingBottom: `calc(${CHAT_BOTTOM_INSET} + 18px)` }}
          >
            {turns.map((turn, turnIndex) => (
              <ConversationTurn
                key={turn.id}
                turn={turn}
                turnIndex={turnIndex + 1}
                activeChatId={activeChatId}
                editingUserMessageId={editingUserMessageId}
                actionsDisabled={actionsDisabled}
                onEnterEdit={setEditingUserMessageId}
                onExitEdit={() => setEditingUserMessageId(null)}
                onSubmitEdit={(messageId, text, attachments) => {
                  void onSubmitEditedUserMessage(messageId, text, attachments)
                }}
                onAttachmentError={onAttachmentError}
              />
            ))}

            {showStatus ? <AgentStatus stage={stage} /> : null}

            <div ref={bottomRef} className="h-px shrink-0 [overflow-anchor:auto]" />
          </div>
        </div>
      </AgentChatScrollArea>
    </div>
  )
}
