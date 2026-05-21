import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AgentChatScrollArea } from './AgentChatScrollArea'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { Message } from '@/entities/message/model/types'
import { useChatsStore } from '@/entities/chat/model/store'
import type { PipelineStage } from '@/entities/conversation/model/store'
import { CHAT_COLUMN_MAX_WIDTH_CLASS } from '@/shared/lib/layout'
import { CHAT_BOTTOM_INSET } from '@/widgets/conversation-panel/lib/chat-layout'
import {
  applyScrollTop,
  findScrollAnchorAtScrollTop
} from '@/widgets/conversation-panel/lib/chat-scroll-anchor'
import {
  recallChatScrollPosition,
  rememberChatScrollPosition
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

const AT_BOTTOM_THRESHOLD_PX = 80
const SCROLL_STORE_PERSIST_IDLE_MS = 400

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

const MIN_SAVED_SCROLL_TOP_PX = 8

function resolveSavedScroll(
  chatId: string,
  storeScrollTop: number | null | undefined,
  storeTurnId: string | null | undefined
): { scrollTop: number | null; userMessageId: string | null } {
  const memory = recallChatScrollPosition(chatId)
  const memoryScroll =
    memory?.scrollTop != null && memory.scrollTop >= MIN_SAVED_SCROLL_TOP_PX
      ? memory.scrollTop
      : null
  const storeScroll =
    storeScrollTop != null && storeScrollTop >= MIN_SAVED_SCROLL_TOP_PX
      ? storeScrollTop
      : null
  const scrollTop = memoryScroll ?? storeScroll ?? null
  const userMessageId =
    scrollTop != null ? (memory?.userMessageId ?? storeTurnId ?? null) : null
  return { scrollTop, userMessageId }
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
  const skipSaveAnchorRef = useRef(false)
  const isRestoringScrollRef = useRef(false)
  const restoreTargetScrollTopRef = useRef<number | null>(null)
  const scrollMemoryRafRef = useRef<number | null>(null)
  const persistIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPersistedScrollRef = useRef<{
    chatId: string
    scrollTop: number
    anchorId: string | null
  } | null>(null)

  const setChatScrollAnchor = useChatsStore((s) => s.setChatScrollAnchor)
  const restoreInitChatIdRef = useRef<string | null>(null)

  const [editingUserMessageId, setEditingUserMessageId] = useState<string | null>(null)
  const atBottomRef = useRef(true)
  const [atBottom, setAtBottom] = useState(true)
  const showStatus = ACTIVE_STAGES.includes(stage)

  const scrollToLatest = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  const skipAutoScrollOnMountRef = useRef(true)
  const prevMessagesLengthRef = useRef(messages.length)

  const handleAtBottomChange = useCallback(
    (value: boolean) => {
      if (isRestoringScrollRef.current) return
      if (atBottomRef.current === value) return
      atBottomRef.current = value
      setAtBottom(value)
      onAtBottomChange?.(value)
    },
    [onAtBottomChange]
  )

  const persistScrollPosition = useCallback(
    (viewport: HTMLDivElement, chatId: string) => {
      if (skipSaveAnchorRef.current || isRestoringScrollRef.current) return

      const scrollTop = viewport.scrollTop
      const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight)
      const atBottomNow = maxScroll - scrollTop < AT_BOTTOM_THRESHOLD_PX

      if (atBottomNow && scrollTop <= AT_BOTTOM_THRESHOLD_PX) {
        rememberChatScrollPosition(chatId, 0, null)
        lastPersistedScrollRef.current = null
        setChatScrollAnchor(chatId, null, null)
        return
      }

      if (scrollTop < MIN_SAVED_SCROLL_TOP_PX) {
        rememberChatScrollPosition(chatId, 0, null)
        lastPersistedScrollRef.current = null
        setChatScrollAnchor(chatId, null, null)
        return
      }

      const roundedScrollTop = Math.round(scrollTop)
      const anchorId = findScrollAnchorAtScrollTop(viewport, scrollTop)
      const last = lastPersistedScrollRef.current
      if (
        last?.chatId === chatId &&
        last.scrollTop === roundedScrollTop &&
        last.anchorId === anchorId
      ) {
        return
      }

      lastPersistedScrollRef.current = {
        chatId,
        scrollTop: roundedScrollTop,
        anchorId
      }
      rememberChatScrollPosition(chatId, scrollTop, anchorId)
      setChatScrollAnchor(chatId, anchorId, scrollTop)
    },
    [setChatScrollAnchor]
  )

  const scheduleScrollMemory = useCallback((viewport: HTMLDivElement) => {
    const chatId = activeChatIdRef.current
    if (!chatId || skipSaveAnchorRef.current || isRestoringScrollRef.current) return

    if (scrollMemoryRafRef.current != null) return

    scrollMemoryRafRef.current = requestAnimationFrame(() => {
      scrollMemoryRafRef.current = null
      const id = activeChatIdRef.current
      if (!id || skipSaveAnchorRef.current || isRestoringScrollRef.current) return

      const scrollTop = viewport.scrollTop
      if (scrollTop >= MIN_SAVED_SCROLL_TOP_PX) {
        rememberChatScrollPosition(id, scrollTop, null)
      }
    })
  }, [])

  const schedulePersistToStore = useCallback(
    (viewport: HTMLDivElement) => {
      const chatId = activeChatIdRef.current
      if (!chatId || skipSaveAnchorRef.current || isRestoringScrollRef.current) return

      if (persistIdleTimerRef.current != null) {
        clearTimeout(persistIdleTimerRef.current)
      }

      persistIdleTimerRef.current = setTimeout(() => {
        persistIdleTimerRef.current = null
        const id = activeChatIdRef.current
        if (!id || skipSaveAnchorRef.current || isRestoringScrollRef.current) return
        persistScrollPosition(viewport, id)
      }, SCROLL_STORE_PERSIST_IDLE_MS)
    },
    [persistScrollPosition]
  )

  const handleViewportScroll = useCallback(
    (viewport: HTMLDivElement) => {
      scheduleScrollMemory(viewport)
      schedulePersistToStore(viewport)
    },
    [scheduleScrollMemory, schedulePersistToStore]
  )

  const handleViewportRef = useCallback((el: HTMLDivElement | null) => {
    viewportRef.current = el
  }, [])

  useEffect(() => {
    onScrollToLatestReady?.(() => scrollToLatest('smooth'))
  }, [onScrollToLatestReady, scrollToLatest])

  useEffect(() => {
    setEditingUserMessageId(null)
    skipAutoScrollOnMountRef.current = true

    if (!activeChatId) {
      restoreTargetScrollTopRef.current = null
      restoreInitChatIdRef.current = null
      return
    }

    if (restoreInitChatIdRef.current === activeChatId) return
    restoreInitChatIdRef.current = activeChatId

    const chat = useChatsStore.getState().chats.find((c) => c.id === activeChatId)
    const { scrollTop } = resolveSavedScroll(
      activeChatId,
      chat?.scrollAnchorScrollTop,
      chat?.scrollAnchorUserMessageId
    )
    restoreTargetScrollTopRef.current = scrollTop
    isRestoringScrollRef.current = scrollTop != null

    const followLatest = scrollTop == null
    atBottomRef.current = followLatest
    setAtBottom(followLatest)
    onAtBottomChange?.(followLatest)
  }, [activeChatId, onAtBottomChange])

  useEffect(() => {
    const flush = () => {
      const viewport = viewportRef.current
      const chatId = activeChatIdRef.current
      if (viewport && chatId) persistScrollPosition(viewport, chatId)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (scrollMemoryRafRef.current != null) {
        cancelAnimationFrame(scrollMemoryRafRef.current)
      }
      if (persistIdleTimerRef.current != null) {
        clearTimeout(persistIdleTimerRef.current)
        persistIdleTimerRef.current = null
      }
      flush()
    }
  }, [persistScrollPosition])

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
    if (!viewport || !activeChatId || turns.length === 0) return

    const targetScroll = restoreTargetScrollTopRef.current
    const hasSavedScroll =
      targetScroll != null && targetScroll >= MIN_SAVED_SCROLL_TOP_PX

    if (!hasSavedScroll) {
      scrollToLatest('instant')
      restoreTargetScrollTopRef.current = null
      isRestoringScrollRef.current = false
      skipAutoScrollOnMountRef.current = false
      return
    }

    isRestoringScrollRef.current = true
    skipSaveAnchorRef.current = true

    let cancelled = false
    let done = false

    const finishRestore = (scrolledToBottom: boolean) => {
      if (done) return
      done = true
      restoreTargetScrollTopRef.current = null
      isRestoringScrollRef.current = false

      if (!scrolledToBottom && viewport.scrollTop > 0) {
        rememberChatScrollPosition(
          activeChatId,
          viewport.scrollTop,
          findScrollAnchorAtScrollTop(viewport, viewport.scrollTop)
        )
      }

      if (scrolledToBottom) {
        atBottomRef.current = true
        setAtBottom(true)
        onAtBottomChange?.(true)
      } else {
        atBottomRef.current = false
        setAtBottom(false)
        onAtBottomChange?.(false)
      }

      requestAnimationFrame(() => {
        skipSaveAnchorRef.current = false
      })
    }

    const attemptRestore = (): boolean => {
      if (cancelled || done) return true

      if (hasSavedScroll && targetScroll != null) {
        const { contentReady } = applyScrollTop(viewport, targetScroll)
        if (!contentReady) return false
        finishRestore(false)
        return true
      }

      return false
    }

    if (attemptRestore()) {
      return () => {
        cancelled = true
      }
    }

    const content = viewport.querySelector('[data-chat-scroll-content]') ?? viewport.firstElementChild
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
  }, [activeChatId, turns.length, onAtBottomChange, scrollToLatest])

  useEffect(() => {
    if (skipAutoScrollOnMountRef.current) {
      skipAutoScrollOnMountRef.current = false
      prevMessagesLengthRef.current = messages.length
      return
    }

    if (isRestoringScrollRef.current) return
    if (!atBottom) return

    const messagesGrew = messages.length > prevMessagesLengthRef.current
    prevMessagesLengthRef.current = messages.length

    if (!messagesGrew && !showStatus) return

    scrollToLatest('instant')
  }, [messages, stage, showStatus, atBottom, scrollToLatest])

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
          className={cn(
            'mx-auto min-h-full px-4 pt-[18px] sm:px-6',
            CHAT_COLUMN_MAX_WIDTH_CLASS
          )}
        >
          <div
            data-chat-scroll-content
            className={cn('relative min-h-full', turns.length > 0 && 'space-y-5')}
            style={{ paddingBottom: `calc(${CHAT_BOTTOM_INSET} + 18px)` }}
          >
            {turns.map((turn) => (
              <ConversationTurn
                key={turn.id}
                turn={turn}
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

            <div ref={bottomRef} className="h-px shrink-0" />
          </div>
        </div>
      </AgentChatScrollArea>
    </div>
  )
}
