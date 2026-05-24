import { useCallback, useEffect, useRef, useState } from 'react'
import { useChatsStore } from '@/entities/chat/model/store'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import { isChatAgentBusy } from '@/features/ai-chat/lib/chat-agent-busy'
import { isPlaybackOnlyConversationError } from '@/features/ai-chat/lib/post-reply'
import { useConversationStore } from '@/entities/conversation/model/store'

const AUTO_LISTEN_DELAY_MS = 500

interface Options {
  mode: ChatComposerMode
  stage: string
  voiceBusy: boolean
  agentBusy: boolean
  speechError: string | null
  onStartListening: () => void
}

export function useLiveConversationLoop({
  mode,
  stage,
  voiceBusy,
  agentBusy,
  speechError,
  onStartListening
}: Options) {
  const activeRef = useRef(false)
  const sessionChatIdRef = useRef<string | null>(null)
  const listenGenerationRef = useRef(0)
  const [isLiveConversationActive, setIsLiveConversationActive] = useState(false)
  const autoListenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const voiceBusyRef = useRef(voiceBusy)
  const agentBusyRef = useRef(agentBusy)
  const speechErrorRef = useRef(speechError)
  const modeRef = useRef(mode)

  voiceBusyRef.current = voiceBusy
  agentBusyRef.current = agentBusy
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

  const scheduleAutoListen = useCallback(() => {
    if (modeRef.current !== 'conversation' || !activeRef.current) return
    if (stage === 'listening' || stage === 'transcribing') return
    if (stage !== 'idle' || voiceBusy || agentBusy || speechError) return

    const sessionChatId = sessionChatIdRef.current
    const activeChatId = useChatsStore.getState().activeChatId
    if (!sessionChatId || !activeChatId || sessionChatId !== activeChatId) return

    clearAutoListenTimer()
    const generation = listenGenerationRef.current
    autoListenTimerRef.current = setTimeout(() => {
      autoListenTimerRef.current = null
      if (generation !== listenGenerationRef.current) return
      if (modeRef.current !== 'conversation' || !activeRef.current) return

      const currentActiveChatId = useChatsStore.getState().activeChatId
      if (
        !sessionChatIdRef.current ||
        currentActiveChatId !== sessionChatIdRef.current
      ) {
        return
      }

      const { stage: currentStage, error: pipelineError } =
        useConversationStore.getState()
      const pipelineBlocksListen =
        pipelineError != null && !isPlaybackOnlyConversationError(pipelineError)
      if (
        currentStage !== 'idle' ||
        speechErrorRef.current ||
        pipelineBlocksListen ||
        voiceBusyRef.current ||
        agentBusyRef.current ||
        isChatAgentBusy(currentActiveChatId)
      ) {
        return
      }

      onStartListening()
    }, AUTO_LISTEN_DELAY_MS)
  }, [
    agentBusy,
    clearAutoListenTimer,
    onStartListening,
    speechError,
    stage,
    voiceBusy
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
    scheduleAutoListen
  }
}
