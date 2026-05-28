import { useCallback, useEffect, useRef, useState } from 'react'
import { PENDING_COMPOSER_CHAT_ID } from '@/entities/chat/lib/pending-composer'
import { useChatsStore } from '@/entities/chat/model/store'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import type { AgentTurnPhase } from '@/features/ai-chat/lib/chat-agent-transitions'
import {
  getAgentSessionSnapshot,
  isAgentSessionBusy
} from '@/features/ai-chat/lib/agent-session-snapshot'
import { isPlaybackOnlyConversationError } from '@/features/ai-chat/lib/post-reply'
import { useConversationStore } from '@/entities/conversation/model/store'

const AUTO_LISTEN_DELAY_MS = 500

interface Options {
  mode: ChatComposerMode
  /** Voice capture stages (not agent LLM). */
  voiceStage: string
  /** Agent turn phase for the active chat (from `AgentSessionSnapshot`). */
  agentPhase: AgentTurnPhase
  voiceBusy: boolean
  speechError: string | null
  onStartListening: () => void
}

export function useLiveConversationLoop({
  mode,
  voiceStage,
  agentPhase,
  voiceBusy,
  speechError,
  onStartListening
}: Options) {
  const activeRef = useRef(false)
  const sessionChatIdRef = useRef<string | null>(null)
  const listenGenerationRef = useRef(0)
  const [isLiveConversationActive, setIsLiveConversationActive] = useState(false)
  const autoListenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const voiceBusyRef = useRef(voiceBusy)
  const agentPhaseRef = useRef(agentPhase)
  const speechErrorRef = useRef(speechError)
  const modeRef = useRef(mode)

  voiceBusyRef.current = voiceBusy
  agentPhaseRef.current = agentPhase
  speechErrorRef.current = speechError
  modeRef.current = mode

  const clearAutoListenTimer = useCallback(() => {
    if (autoListenTimerRef.current) {
      clearTimeout(autoListenTimerRef.current)
      autoListenTimerRef.current = null
    }
  }, [])

  const stopLiveConversation = useCallback(() => {
    activeRef.current = false
    sessionChatIdRef.current = null
    listenGenerationRef.current += 1
    setIsLiveConversationActive(false)
    clearAutoListenTimer()
  }, [clearAutoListenTimer])

  const startLiveConversation = useCallback((chatId: string) => {
    sessionChatIdRef.current = chatId
    activeRef.current = true
    listenGenerationRef.current += 1
    setIsLiveConversationActive(true)
  }, [])

  const syncSessionChatId = useCallback((chatId: string) => {
    if (!activeRef.current) return
    sessionChatIdRef.current = chatId
  }, [])

  const scheduleAutoListen = useCallback(() => {
    if (modeRef.current !== 'conversation' || !activeRef.current) return
    if (voiceStage === 'listening' || voiceStage === 'transcribing') return
    if (agentPhase !== 'idle' || voiceBusy || speechError) return

    const sessionChatId = sessionChatIdRef.current
    const activeChatId = useChatsStore.getState().activeChatId
    if (!sessionChatId) return

    const sessionMatchesView =
      sessionChatId === PENDING_COMPOSER_CHAT_ID
        ? activeChatId == null
        : sessionChatId === activeChatId
    if (!sessionMatchesView) return

    clearAutoListenTimer()
    const generation = listenGenerationRef.current
    autoListenTimerRef.current = setTimeout(() => {
      autoListenTimerRef.current = null
      if (generation !== listenGenerationRef.current) return
      if (modeRef.current !== 'conversation' || !activeRef.current) return

      const currentSessionChatId = sessionChatIdRef.current
      const currentActiveChatId = useChatsStore.getState().activeChatId
      if (!currentSessionChatId) return

      const stillMatchesView =
        currentSessionChatId === PENDING_COMPOSER_CHAT_ID
          ? currentActiveChatId == null
          : currentSessionChatId === currentActiveChatId
      if (!stillMatchesView) return

      const { stage: currentVoiceStage, error: pipelineError } =
        useConversationStore.getState()
      const pipelineBlocksListen =
        pipelineError != null && !isPlaybackOnlyConversationError(pipelineError)
      if (
        currentVoiceStage === 'listening' ||
        currentVoiceStage === 'transcribing' ||
        speechErrorRef.current ||
        pipelineBlocksListen ||
        voiceBusyRef.current ||
        agentPhaseRef.current !== 'idle' ||
        isAgentSessionBusy(getAgentSessionSnapshot(currentActiveChatId))
      ) {
        return
      }

      onStartListening()
    }, AUTO_LISTEN_DELAY_MS)
  }, [
    agentPhase,
    clearAutoListenTimer,
    onStartListening,
    speechError,
    voiceBusy,
    voiceStage
  ])

  useEffect(() => {
    if (mode !== 'conversation') {
      stopLiveConversation()
    }
  }, [mode, stopLiveConversation])

  const pipelineError = useConversationStore((s) => s.error)

  useEffect(() => {
    scheduleAutoListen()
    return clearAutoListenTimer
  }, [clearAutoListenTimer, pipelineError, scheduleAutoListen])

  return {
    isLiveConversationActive,
    startLiveConversation,
    stopLiveConversation,
    scheduleAutoListen,
    syncSessionChatId
  }
}
