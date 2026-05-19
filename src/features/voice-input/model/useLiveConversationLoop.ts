import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'

const AUTO_LISTEN_DELAY_MS = 450

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
  const listenGenerationRef = useRef(0)
  const [isLiveConversationActive, setIsLiveConversationActive] = useState(false)
  const autoListenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAutoListenTimer = useCallback(() => {
    if (autoListenTimerRef.current) {
      clearTimeout(autoListenTimerRef.current)
      autoListenTimerRef.current = null
    }
  }, [])

  const stopLiveConversation = useCallback(() => {
    activeRef.current = false
    listenGenerationRef.current += 1
    setIsLiveConversationActive(false)
    clearAutoListenTimer()
  }, [clearAutoListenTimer])

  const startLiveConversation = useCallback(() => {
    activeRef.current = true
    listenGenerationRef.current += 1
    setIsLiveConversationActive(true)
  }, [])

  useEffect(() => {
    if (mode !== 'conversation') {
      stopLiveConversation()
    }
  }, [mode, stopLiveConversation])

  useEffect(() => {
    if (mode !== 'conversation' || !activeRef.current) return
    if (stage !== 'idle' || voiceBusy || agentBusy || speechError) return

    clearAutoListenTimer()
    const generation = listenGenerationRef.current
    autoListenTimerRef.current = setTimeout(() => {
      autoListenTimerRef.current = null
      if (generation !== listenGenerationRef.current) return
      if (mode !== 'conversation' || !activeRef.current) return
      if (useConversationStore.getState().stage !== 'idle') return
      if (speechError) return
      onStartListening()
    }, AUTO_LISTEN_DELAY_MS)

    return clearAutoListenTimer
  }, [
    agentBusy,
    clearAutoListenTimer,
    mode,
    onStartListening,
    speechError,
    stage,
    voiceBusy
  ])

  return {
    isLiveConversationActive,
    startLiveConversation,
    stopLiveConversation
  }
}
