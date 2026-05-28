import { useConversationStore } from '@/entities/conversation/model/store'
import type { AgentStopContext } from '@/features/ai-chat/lib/chat-agent-stop'
import type { AgentTurnSession } from '@/features/ai-chat/model/run-agent-turn'
import type { ChatStreamController } from '@/shared/types/ipc'
import type { StreamingSentenceTts } from '@/features/text-to-speech/model/streamingSentenceTts'

export type AgentChatSessionRefs = {
  streamControllerRef: { current: ChatStreamController | null }
  streamTargetChatIdRef: { current: string | null }
  streamingTtsRef: { current: StreamingSentenceTts | null }
  /** Optional; stream activity is tracked in `agent-stream-session`. */
  setStreamActive?: (active: boolean) => void
}

const sharedSessionRefs: AgentChatSessionRefs = {
  streamControllerRef: { current: null },
  streamTargetChatIdRef: { current: null },
  streamingTtsRef: { current: null }
}

/** Single in-flight stream/TTS session for the renderer agent (desktop + web). */
export function getSharedAgentChatSessionRefs(): AgentChatSessionRefs {
  return sharedSessionRefs
}

export type AgentStopContextCallbacks = {
  setBlurAnimateMessageId: (id: string | null) => void
  setGlobalStageIdle: () => void
}

export function buildAgentTurnSession(refs: AgentChatSessionRefs): AgentTurnSession {
  return {
    getStreamController: () => refs.streamControllerRef.current,
    setStreamController: (controller) => {
      refs.streamControllerRef.current = controller
    },
    getStreamTargetChatId: () => refs.streamTargetChatIdRef.current,
    setStreamTargetChatId: (chatId) => {
      refs.streamTargetChatIdRef.current = chatId
    },
    getStreamingTts: () => refs.streamingTtsRef.current,
    setStreamingTts: (tts) => {
      refs.streamingTtsRef.current = tts
    },
    setStreamActive: refs.setStreamActive ?? (() => undefined)
  }
}

export function buildAgentStopContext(
  refs: AgentChatSessionRefs,
  callbacks: AgentStopContextCallbacks
): AgentStopContext {
  return {
    streamController: refs.streamControllerRef.current,
    streamTargetChatId: refs.streamTargetChatIdRef.current,
    streamingTts: refs.streamingTtsRef.current,
    setStreamController: (controller) => {
      refs.streamControllerRef.current = controller
    },
    setStreamTargetChatId: (chatId) => {
      refs.streamTargetChatIdRef.current = chatId
    },
    setStreamActive: refs.setStreamActive ?? (() => undefined),
    setStreamingTts: (tts) => {
      refs.streamingTtsRef.current = tts
    },
    setBlurAnimateMessageId: callbacks.setBlurAnimateMessageId,
    setGlobalStageIdle: callbacks.setGlobalStageIdle
  }
}

export function createGlobalStageIdleCallback(
  setStage: (stage: 'idle') => void
): () => void {
  return () => {
    setStage('idle')
    useConversationStore.getState().clearPipelineDetail()
  }
}

export function buildDefaultAgentStopContext(): AgentStopContext {
  return buildAgentStopContext(getSharedAgentChatSessionRefs(), {
    setBlurAnimateMessageId: (id) => {
      useConversationStore.getState().setBlurAnimateMessageId(id)
    },
    setGlobalStageIdle: createGlobalStageIdleCallback((stage) => {
      useConversationStore.getState().setStage(stage)
    })
  })
}
