import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRafCoalescer } from '@/shared/lib/raf-coalesce'
import { AgentChatScrollArea } from './AgentChatScrollArea'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { Message } from '@/entities/message/model/types'
import {
  registerChatFollowBottom,
  registerChatScrollFlush
} from '@/app/lib/chat-scroll-registry'
import { flushChatPersistDebounce } from '@/entities/chat/lib/chat-persist-storage'
import { CHAT_SCROLL_MIN_PX } from '@/entities/chat/lib/chat-scroll-persist'
import { useChatsStore } from '@/entities/chat/model/store'
import {
  useConversationStore,
  type PipelineStage
} from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { CONVERSATION_DENSITY_GAP_CLASS } from '@/shared/lib/appearance'
import { CHAT_COLUMN_MAX_WIDTH_CLASS } from '@/shared/lib/layout'
import { CHAT_BOTTOM_INSET } from '@/widgets/conversation-panel/lib/chat-layout'
import { shouldDismissUserMessageEdit } from '@/widgets/conversation-panel/lib/user-message-edit-dismiss'
import {
  applyScrollTop,
  scrollViewportToBottom,
} from '@/widgets/conversation-panel/lib/chat-scroll-anchor'
import {
  buildChatTailScrollSignature,
  isViewportNearChatBottom,
  shouldStickToBottom,
  stickChatViewportToBottom
} from '@/widgets/conversation-panel/lib/chat-scroll-follow'
import {
  recallChatScrollTop,
  rememberChatScrollTop
} from '@/widgets/conversation-panel/lib/chat-scroll-memory'
import {
  mergeChatScrollRestoreTarget
} from '@/widgets/conversation-panel/lib/chat-scroll-restore-target'
import {
  buildScrollRestoreSessionKey,
  shouldSkipScrollRestore
} from '@/widgets/conversation-panel/lib/chat-scroll-restore'
import {
  groupMessagesIntoTurns,
  lastAssistantMessageId,
  messageHasVisibleContent,
  voiceCaptureLabelForUserMessage
} from '@/widgets/conversation-panel/lib/group-turns'
import { cn } from '@/shared/lib/utils'
import {
  initialHiddenTurnCount,
  nextHiddenTurnCount,
  hiddenTurnsRemaining
} from '@/widgets/conversation-panel/lib/conversation-turn-window'
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog'
import { AgentStatus } from './AgentStatus'
import { ChatEmptyPrompt } from './ChatEmptyPrompt'
import type { EditSpeechTarget } from '@/widgets/conversation-panel/lib/edit-speech-target'
import { ConversationTurn } from './ConversationTurn'
import { LoadEarlierTurnsButton } from './LoadEarlierTurnsButton'
import { QueueAheadHint } from './QueueAheadHint'
import type { SubmitEditedUserMessageResult } from '@/features/ai-chat/model/submit-edited-user-message'

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
  agentBusy?: boolean
  onStopAgent?: () => void
  voiceSupported?: boolean
  voiceBusy?: boolean
  isVoiceListening?: boolean
  onVoicePress?: () => void
  onVoiceStop?: () => void
  onRegisterEditSpeech?: (target: EditSpeechTarget | null) => void
  onSubmitEditedUserMessage: (
    messageId: string,
    text: string,
    attachments?: MessageAttachment[]
  ) => Promise<SubmitEditedUserMessageResult>
  onAtBottomChange?: (atBottom: boolean) => void
  onShowScrollToLatestChange?: (show: boolean) => void
  onScrollToLatestReady?: (api: {
    scrollToLatest: (behavior?: ScrollBehavior) => void
    followBottom: () => void
  }) => void
  onAttachmentError?: (message: string) => void
  /** User message id while Agent Speech capture is in progress (may be empty). */
  liveVoiceUserMessageId?: string | null
  onRegenerateAssistantMessage?: (messageId: string) => void
}

export function ConversationPanel({
  messages,
  stage,
  activeChatId,
  actionsDisabled,
  agentBusy = false,
  onStopAgent,
  voiceSupported,
  voiceBusy,
  isVoiceListening,
  onVoicePress,
  onVoiceStop,
  onRegisterEditSpeech,
  onSubmitEditedUserMessage,
  onAtBottomChange,
  onShowScrollToLatestChange,
  onScrollToLatestReady,
  onAttachmentError,
  liveVoiceUserMessageId = null,
  onRegenerateAssistantMessage
}: ConversationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const activeChatIdRef = useRef(activeChatId)
  activeChatIdRef.current = activeChatId

  const skipSaveRef = useRef(false)
  const scrollSaveEnabledRef = useRef(false)
  const isRestoringScrollRef = useRef(false)
  const scrollRestoreCompletedRef = useRef<string | null>(null)
  const restoreTargetRef = useRef<{ chatId: string; scrollTop: number | null } | null>(null)
  const prevRestoreChatIdRef = useRef<string | null>(activeChatId)
  const scrollMemoryRafRef = useRef<number | null>(null)
  const persistIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPersistedScrollRef = useRef<{ chatId: string; scrollTop: number } | null>(null)
  const [scrollRestoreEpoch, setScrollRestoreEpoch] = useState(0)

  const setChatScrollPosition = useChatsStore((s) => s.setChatScrollPosition)
  const queueAheadPreview = useConversationStore((s) => s.queueAheadPreview)
  const pipelineStreamingAnswer = useConversationStore((s) => s.pipelineStreamingAnswer)
  const pipelineSearchActiveUrl = useConversationStore((s) => s.pipelineSearchActiveUrl)
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
  const [pendingCheckpointSubmit, setPendingCheckpointSubmit] = useState<{
    messageId: string
    text: string
    attachments?: MessageAttachment[]
  } | null>(null)
  const [checkpointConfirmOpen, setCheckpointConfirmOpen] = useState(false)
  const [checkpointDontShowAgain, setCheckpointDontShowAgain] = useState(false)
  const atBottomRef = useRef(true)
  /** Follow the latest messages until the user scrolls up. */
  const pinToBottomRef = useRef(false)
  /** Follow agent stream until the user scrolls up during the reply. */
  const agentAutoFollowRef = useRef(false)
  const stickCoalescerRef = useRef(createRafCoalescer(() => {}))
  const assistantStreaming =
    agentBusy &&
    stage !== 'speaking' &&
    stage !== 'listening' &&
    stage !== 'transcribing' &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === 'assistant' &&
    messages[messages.length - 1].content.length > 0
  const thinkingLiveInChat = useMemo(() => {
    if (!agentBusy || pipelineStreamingAnswer) return false
    const reasoningStage = stage === 'thinking'
    if (!reasoningStage) return false
    const latestTurn = groupMessagesIntoTurns(messages).at(-1)
    return latestTurn?.assistantMessages.some((m) => m.role === 'thinking') ?? false
  }, [agentBusy, messages, pipelineStreamingAnswer, stage])
  const searchSourcesVisibleInLatestTurn = useMemo(() => {
    const latestTurn = groupMessagesIntoTurns(messages).at(-1)
    return (
      latestTurn?.assistantMessages.some(
        (m) => m.role === 'assistant' && (m.searchSources?.length ?? 0) > 0
      ) ?? false
    )
  }, [messages])
  const showStatus =
    ACTIVE_STAGES.includes(stage) &&
    !assistantStreaming &&
    !(stage === 'thinking' && thinkingLiveInChat) &&
    !(stage === 'searching' && searchSourcesVisibleInLatestTurn)

  const checkpointReturnConfirmEnabled = useSettingsStore((s) => s.checkpointReturnConfirmEnabled)
  const setCheckpointReturnConfirmEnabled = useSettingsStore(
    (s) => s.setCheckpointReturnConfirmEnabled
  )
  const conversationDensity = useSettingsStore((s) => s.conversationDensity)
  const conversationGapClass =
    CONVERSATION_DENSITY_GAP_CLASS[conversationDensity] ??
    CONVERSATION_DENSITY_GAP_CLASS.default

  const tailScrollSignature = useMemo(
    () =>
      buildChatTailScrollSignature(messages, {
        pipelineStage: stage,
        pipelineSearchActiveUrl
      }),
    [messages, pipelineSearchActiveUrl, stage]
  )

  const scrollToLatest = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      pinToBottomRef.current = true
      const viewport = viewportRef.current
      if (viewport) {
        scrollViewportToBottom(viewport, behavior)
      } else {
        bottomRef.current?.scrollIntoView({ behavior, block: 'end' })
      }
      atBottomRef.current = true
      onAtBottomChange?.(true)
    },
    [onAtBottomChange]
  )

  const stickToBottomNow = useCallback(() => {
    pinToBottomRef.current = true
    const viewport = viewportRef.current
    if (viewport) stickChatViewportToBottom(viewport, onAtBottomChange)
    else scrollToLatest('instant')
    atBottomRef.current = true
  }, [onAtBottomChange, scrollToLatest])

  const followBottom = useCallback(() => {
    stickToBottomNow()
    requestAnimationFrame(() => {
      stickToBottomNow()
      requestAnimationFrame(stickToBottomNow)
    })
  }, [stickToBottomNow])

  useEffect(() => registerChatFollowBottom(followBottom), [followBottom])

  const skipAutoScrollOnMountRef = useRef(true)
  const prevMessagesLengthRef = useRef(messages.length)
  const prevShowStatusRef = useRef(showStatus)
  const prevTailScrollSignatureRef = useRef(tailScrollSignature)
  const prevAgentBusyRef = useRef(agentBusy)
  const prevStageRef = useRef(stage)

  const handleAtBottomChange = useCallback(
    (value: boolean) => {
      if (isRestoringScrollRef.current) return
      if (!value && !agentBusy) pinToBottomRef.current = false
      if (atBottomRef.current === value) return
      atBottomRef.current = value
      onAtBottomChange?.(value)
    },
    [agentBusy, onAtBottomChange]
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

  const syncFollowFromViewport = useCallback(
    (viewport: HTMLDivElement) => {
      if (isRestoringScrollRef.current || agentBusy) return
      const nearBottom = isViewportNearChatBottom(viewport)
      if (!nearBottom) {
        pinToBottomRef.current = false
      }
    },
    [agentBusy]
  )

  const handleViewportScroll = useCallback(
    (viewport: HTMLDivElement) => {
      syncFollowFromViewport(viewport)

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
    [schedulePersistToStore, syncFollowFromViewport]
  )

  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)

  const handleViewportRef = useCallback((el: HTMLDivElement | null) => {
    viewportRef.current = el
    setScrollElement(el)
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

  const scrollApiRef = useRef({ scrollToLatest, followBottom })
  scrollApiRef.current = { scrollToLatest, followBottom }

  useEffect(() => {
    onScrollToLatestReady?.(scrollApiRef.current)
  }, [onScrollToLatestReady])

  useEffect(() => {
    if (useChatsStore.persist.hasHydrated()) {
      setChatsStoreHydrated(true)
      return
    }
    return useChatsStore.persist.onFinishHydration(() => {
      setChatsStoreHydrated(true)
    })
  }, [])

  const handleSubmitEditedUserMessage = useCallback(
    async (messageId: string, text: string, attachments?: MessageAttachment[]) => {
      const messageIndex = messages.findIndex((m) => m.id === messageId)
      const hasTrailingMessages =
        messageIndex >= 0 && messages.slice(messageIndex + 1).some((m) => m.role !== 'system')

      if (checkpointReturnConfirmEnabled && hasTrailingMessages) {
        setPendingCheckpointSubmit({ messageId, text, attachments })
        setCheckpointDontShowAgain(false)
        setCheckpointConfirmOpen(true)
        return
      }

      followBottom()
      const result = await onSubmitEditedUserMessage(messageId, text, attachments)
      if (result?.rollbackToEdit) {
        setEditingUserMessageId(result.rollbackToEdit)
      } else {
        setEditingUserMessageId(null)
      }
    },
    [
      checkpointReturnConfirmEnabled,
      followBottom,
      messages,
      onSubmitEditedUserMessage
    ]
  )

  const handleEnterEdit = useCallback((messageId: string) => {
    setEditingUserMessageId(messageId)
  }, [])

  const handleConfirmCheckpointReturn = useCallback(async () => {
    if (!pendingCheckpointSubmit) return
    if (checkpointDontShowAgain) {
      setCheckpointReturnConfirmEnabled(false)
    }

    const { messageId, text, attachments } = pendingCheckpointSubmit
    setPendingCheckpointSubmit(null)
    setCheckpointConfirmOpen(false)
    setCheckpointDontShowAgain(false)

    followBottom()
    const result = await onSubmitEditedUserMessage(messageId, text, attachments)
    if (result?.rollbackToEdit) {
      setEditingUserMessageId(result.rollbackToEdit)
    } else {
      setEditingUserMessageId(null)
    }
  }, [
    checkpointDontShowAgain,
    followBottom,
    onSubmitEditedUserMessage,
    pendingCheckpointSubmit,
    setCheckpointReturnConfirmEnabled
  ])

  const stickToBottomIfFollowing = useCallback(() => {
    if (agentAutoFollowRef.current) {
      stickToBottomNow()
      return
    }
    const viewport = viewportRef.current
    if (
      !shouldStickToBottom(
        {
          pinToBottom: pinToBottomRef.current,
          isRestoring: isRestoringScrollRef.current,
          agentBusy
        },
        viewport
      )
    ) {
      return
    }
    if (viewport) stickChatViewportToBottom(viewport, onAtBottomChange)
    else scrollToLatest('instant')
    pinToBottomRef.current = true
    atBottomRef.current = true
  }, [agentBusy, onAtBottomChange, scrollToLatest, stickToBottomNow])

  useEffect(() => {
    stickCoalescerRef.current.cancel()
    stickCoalescerRef.current = createRafCoalescer(() => stickToBottomIfFollowing())
    return () => stickCoalescerRef.current.cancel()
  }, [stickToBottomIfFollowing])

  const scheduleStickToBottomIfFollowing = useCallback(() => {
    stickCoalescerRef.current.schedule()
  }, [])

  useEffect(() => {
    const prevChatId = prevRestoreChatIdRef.current
    const chatChanged = prevChatId !== activeChatId

    if (chatChanged && prevChatId) {
      const viewport = viewportRef.current
      if (viewport) {
        const scrollTop = Math.round(viewport.scrollTop)
        if (scrollTop >= CHAT_SCROLL_MIN_PX) {
          rememberChatScrollTop(prevChatId, scrollTop)
          setChatScrollPosition(prevChatId, scrollTop)
        } else {
          rememberChatScrollTop(prevChatId, 0)
          clearChatScrollPosition(prevChatId)
        }
      }
    }

    prevRestoreChatIdRef.current = activeChatId

    setEditingUserMessageId(null)
    setPendingCheckpointSubmit(null)
    setCheckpointConfirmOpen(false)
    setCheckpointDontShowAgain(false)
    scrollSaveEnabledRef.current = false

    if (chatChanged) {
      scrollRestoreCompletedRef.current = null
      restoreTargetRef.current = null
    }

    if (!activeChatId) {
      isRestoringScrollRef.current = false
      restoreTargetRef.current = null
      return
    }

    if (!chatsStoreHydrated) {
      isRestoringScrollRef.current = true
      return
    }

    const { target, lateHydration } = mergeChatScrollRestoreTarget(
      restoreTargetRef.current,
      activeChatId,
      storedScrollTop,
      chatsStoreHydrated
    )
    restoreTargetRef.current = target
    if (lateHydration) {
      scrollRestoreCompletedRef.current = null
      setScrollRestoreEpoch((epoch) => epoch + 1)
    }

    const saved = restoreTargetRef.current.scrollTop
    isRestoringScrollRef.current = saved != null
    atBottomRef.current = saved == null
    pinToBottomRef.current = saved == null
    skipAutoScrollOnMountRef.current = saved != null
    onAtBottomChange?.(saved == null)

    if (saved == null) {
      enableScrollSave()
    }
  }, [
    activeChatId,
    chatsStoreHydrated,
    enableScrollSave,
    onAtBottomChange,
    setChatScrollPosition,
    storedScrollTop
  ])

  useEffect(() => {
    return registerChatScrollFlush(() => flushScrollPosition(true))
  }, [flushScrollPosition])

  useEffect(() => {
    return () => {
      stickCoalescerRef.current.cancel()
      if (scrollMemoryRafRef.current != null) {
        cancelAnimationFrame(scrollMemoryRafRef.current)
      }
      if (persistIdleTimerRef.current != null) {
        clearTimeout(persistIdleTimerRef.current)
        persistIdleTimerRef.current = null
      }
      flushScrollPosition(true)
      flushChatPersistDebounce()
    }
  }, [flushScrollPosition])

  useEffect(() => {
    if (!editingUserMessageId) return

    const onPointerDown = (event: PointerEvent) => {
      if (!shouldDismissUserMessageEdit(event.target)) return
      setEditingUserMessageId(null)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [editingUserMessageId])

  const turns = useMemo(
    () => groupMessagesIntoTurns(messages, { preserveEmptyUserMessageId: liveVoiceUserMessageId }),
    [liveVoiceUserMessageId, messages]
  )
  const lastReplyMessageId = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i -= 1) {
      const id = lastAssistantMessageId(turns[i]!.assistantMessages)
      if (id) return id
    }
    return null
  }, [turns])
  const [hiddenTurnCount, setHiddenTurnCount] = useState(0)

  useEffect(() => {
    setHiddenTurnCount(initialHiddenTurnCount(turns.length))
    agentAutoFollowRef.current = false
  }, [activeChatId])

  useEffect(() => {
    setHiddenTurnCount((current) => Math.min(current, initialHiddenTurnCount(turns.length)))
  }, [turns.length])

  const visibleTurns = useMemo(
    () => (hiddenTurnCount > 0 ? turns.slice(hiddenTurnCount) : turns),
    [hiddenTurnCount, turns]
  )
  const earlierTurnsRemaining = hiddenTurnsRemaining(hiddenTurnCount)

  useLayoutEffect(() => {
    if (!editingUserMessageId) return
    const turnEl = document.querySelector(`[data-turn-id="${editingUserMessageId}"]`)
    turnEl?.scrollIntoView({ block: 'nearest' })
  }, [editingUserMessageId])

  const hasVisibleMessages = useMemo(
    () => messages.some(messageHasVisibleContent),
    [messages]
  )

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !activeChatId || !chatsStoreHydrated) return

    if (!hasVisibleMessages) {
      const placeholderKey = `${activeChatId}:${messages.length > 0 ? 'placeholder' : 'empty'}`
      if (scrollRestoreCompletedRef.current === placeholderKey) return
      scrollRestoreCompletedRef.current = placeholderKey
      scrollToLatest('instant')
      isRestoringScrollRef.current = false
      skipAutoScrollOnMountRef.current = false
      enableScrollSave()
      return
    }

    const target = restoreTargetRef.current
    if (!target || target.chatId !== activeChatId) return

    const savedScrollTop = target.scrollTop
    const sessionKey = buildScrollRestoreSessionKey(activeChatId, savedScrollTop)
    if (shouldSkipScrollRestore(scrollRestoreCompletedRef.current, sessionKey)) return

    if (savedScrollTop == null) {
      scrollRestoreCompletedRef.current = sessionKey
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
      scrollRestoreCompletedRef.current = sessionKey
      isRestoringScrollRef.current = false
      const nearBottom = isViewportNearChatBottom(viewport)
      atBottomRef.current = nearBottom
      pinToBottomRef.current = nearBottom
      onAtBottomChange?.(nearBottom)
      requestAnimationFrame(() => {
        skipSaveRef.current = false
        enableScrollSave()
        viewport.dispatchEvent(new Event('scroll'))
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
    hasVisibleMessages,
    messages.length,
    scrollRestoreEpoch
  ])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    let lastScrollTop = viewport.scrollTop

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        pinToBottomRef.current = false
        if (agentBusy) agentAutoFollowRef.current = false
      }
    }

    const onScroll = () => {
      if (viewport.scrollTop < lastScrollTop - 1) {
        pinToBottomRef.current = false
        if (agentBusy) agentAutoFollowRef.current = false
      }
      lastScrollTop = viewport.scrollTop
    }

    viewport.addEventListener('wheel', onWheel, { passive: true })
    viewport.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      viewport.removeEventListener('wheel', onWheel)
      viewport.removeEventListener('scroll', onScroll)
    }
  }, [scrollElement, activeChatId])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !hasVisibleMessages) return

    const content =
      viewport.querySelector('[data-chat-scroll-content]') ?? viewport.firstElementChild
    if (!content) return

    const onContentResize = () => {
      scheduleStickToBottomIfFollowing()
    }

    const observer = new ResizeObserver(onContentResize)
    observer.observe(content)
    return () => observer.disconnect()
  }, [activeChatId, hasVisibleMessages, scheduleStickToBottomIfFollowing])

  useLayoutEffect(() => {
    const stageChanged = stage !== prevStageRef.current
    prevStageRef.current = stage
    if (!stageChanged || !agentBusy) return
    if (agentAutoFollowRef.current || pinToBottomRef.current) {
      followBottom()
    }
  }, [agentBusy, followBottom, stage])

  useLayoutEffect(() => {
    if (agentBusy && !prevAgentBusyRef.current) {
      agentAutoFollowRef.current = true
      pinToBottomRef.current = true
      followBottom()
    }
    if (!agentBusy) {
      agentAutoFollowRef.current = false
    }
  }, [agentBusy, followBottom])

  useLayoutEffect(() => {
    const messagesGrew = messages.length > prevMessagesLengthRef.current
    const statusAppeared = showStatus && !prevShowStatusRef.current
    const tailChanged = tailScrollSignature !== prevTailScrollSignatureRef.current
    const agentJustStarted = agentBusy && !prevAgentBusyRef.current
    const userJustSent =
      messagesGrew && messages.length > 0 && messages[messages.length - 1]?.role === 'user'

    prevMessagesLengthRef.current = messages.length
    prevShowStatusRef.current = showStatus
    prevTailScrollSignatureRef.current = tailScrollSignature
    prevAgentBusyRef.current = agentBusy

    if (skipAutoScrollOnMountRef.current) {
      skipAutoScrollOnMountRef.current = false
      if (isRestoringScrollRef.current && !userJustSent) {
        return
      }
    }

    if (isRestoringScrollRef.current && !userJustSent) {
      return
    }

    const contentChanged =
      tailChanged || messagesGrew || statusAppeared || agentJustStarted

    if (!contentChanged) return

    if (userJustSent || agentJustStarted || statusAppeared) {
      agentAutoFollowRef.current = true
      pinToBottomRef.current = true
      followBottom()
      return
    }

    scheduleStickToBottomIfFollowing()
  }, [
    agentBusy,
    followBottom,
    messages.length,
    showStatus,
    tailScrollSignature,
    scheduleStickToBottomIfFollowing
  ])

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
        scrollSessionKey={activeChatId}
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
            className={cn('relative select-none', turns.length > 0 && conversationGapClass)}
            style={{ paddingBottom: `calc(${CHAT_BOTTOM_INSET} + 18px)` }}
          >
            <LoadEarlierTurnsButton
              remaining={earlierTurnsRemaining}
              onLoad={() => setHiddenTurnCount((count) => nextHiddenTurnCount(count))}
            />

            {visibleTurns.map((turn, visibleIndex) => {
              const turnIndex = hiddenTurnCount + visibleIndex
              const isLatestTurn = turnIndex === turns.length - 1
              const showStopOnUserMessage = agentBusy && isLatestTurn

              return (
                <ConversationTurn
                  key={turn.id}
                  turn={turn}
                  turnIndex={turnIndex + 1}
                  userHeaderSticky
                  activeChatId={activeChatId}
                  editingUserMessageId={editingUserMessageId}
                  actionsDisabled={actionsDisabled}
                  showStopOnUserMessage={showStopOnUserMessage}
                  onStopAgent={onStopAgent}
                  voiceSupported={voiceSupported}
                  voiceBusy={voiceBusy}
                  isVoiceListening={isVoiceListening}
                  onVoicePress={onVoicePress}
                  onVoiceStop={onVoiceStop}
                  onRegisterEditSpeech={onRegisterEditSpeech}
                  onEnterEdit={handleEnterEdit}
                  onExitEdit={() => setEditingUserMessageId(null)}
                  onSubmitEdit={(messageId, text, attachments) =>
                    handleSubmitEditedUserMessage(messageId, text, attachments)
                  }
                  onAttachmentError={onAttachmentError}
                  agentBusy={agentBusy}
                  isLatestTurn={isLatestTurn}
                  pipelineStage={isLatestTurn ? stage : 'idle'}
                  pipelineStreamingAnswer={
                    agentBusy && isLatestTurn ? pipelineStreamingAnswer : false
                  }
                  pipelineSearchActiveUrl={
                    isLatestTurn ? pipelineSearchActiveUrl : null
                  }
                  liveVoiceUserMessageId={liveVoiceUserMessageId}
                  voiceCaptureLabel={voiceCaptureLabelForUserMessage(
                    turn.user.id,
                    turn.user.content,
                    liveVoiceUserMessageId,
                    stage
                  )}
                  streamingAssistantMessageId={
                    agentBusy && isLatestTurn && pipelineStreamingAnswer
                      ? lastAssistantMessageId(turn.assistantMessages)
                      : undefined
                  }
                  lastReplyMessageId={lastReplyMessageId}
                  onRegenerateAssistantMessage={onRegenerateAssistantMessage}
                />
              )
            })}

            {queueAheadPreview ? <QueueAheadHint preview={queueAheadPreview} /> : null}

            {showStatus ? <AgentStatus stage={stage} /> : null}

            <div ref={bottomRef} className="h-px shrink-0 [overflow-anchor:none]" />
          </div>
        </div>
      </AgentChatScrollArea>

      <ConfirmActionDialog
        open={checkpointConfirmOpen}
        onOpenChange={(open) => {
          setCheckpointConfirmOpen(open)
          if (!open) {
            setPendingCheckpointSubmit(null)
            setCheckpointDontShowAgain(false)
          }
        }}
        title="Submit from a previous message?"
        description="Submitting from this point will remove all messages after it and start a new assistant reply from here."
        primaryLabel="Revert"
        onPrimary={handleConfirmCheckpointReturn}
        showDontAskAgain
        dontAskAgain={checkpointDontShowAgain}
        onDontAskAgainChange={setCheckpointDontShowAgain}
        dontAskAgainId="checkpoint-return-hide-confirm"
      />
    </div>
  )
}
