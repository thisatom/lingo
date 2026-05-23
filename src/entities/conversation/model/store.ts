import { create } from 'zustand'

export type PipelineStage =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'thinking'
  | 'searching'
  | 'speaking'
  | 'error'

export type PipelineSearchTarget = {
  title: string
  url: string
}

interface ConversationState {
  stage: PipelineStage
  error: string | null
  speechError: string | null
  /** Latest assistant message id pending BlurText (once) */
  blurAnimateMessageId: string | null
  /** Ids that already played blur animation */
  blurAnimatedMessageIds: string[]
  /** Next queued user message shown when TTS was skipped for the queue (conversation). */
  queueAheadPreview: string | null
  /** Reasoning / prep text shown under Thinking…. */
  pipelineThinkingText: string
  /** Sites being fetched during web search. */
  pipelineSearchTargets: PipelineSearchTarget[]
  /** True once the final answer tokens start streaming (after reasoning). */
  pipelineStreamingAnswer: boolean
  setStage: (stage: PipelineStage) => void
  setError: (error: string | null) => void
  setSpeechError: (speechError: string | null) => void
  setBlurAnimateMessageId: (id: string | null) => void
  setQueueAheadPreview: (preview: string | null) => void
  setPipelineThinkingText: (text: string) => void
  setPipelineSearchTargets: (targets: PipelineSearchTarget[]) => void
  setPipelineStreamingAnswer: (streaming: boolean) => void
  clearPipelineDetail: () => void
  markBlurAnimationDone: (id: string) => void
  resetPipeline: () => void
}

export const useConversationStore = create<ConversationState>((set) => ({
  stage: 'idle',
  error: null,
  speechError: null,
  blurAnimateMessageId: null,
  blurAnimatedMessageIds: [],
  queueAheadPreview: null,
  pipelineThinkingText: '',
  pipelineSearchTargets: [],
  pipelineStreamingAnswer: false,
  setStage: (stage) => set({ stage }),
  setQueueAheadPreview: (queueAheadPreview) => set({ queueAheadPreview }),
  setPipelineThinkingText: (pipelineThinkingText) => set({ pipelineThinkingText }),
  setPipelineSearchTargets: (pipelineSearchTargets) => set({ pipelineSearchTargets }),
  setPipelineStreamingAnswer: (pipelineStreamingAnswer) => set({ pipelineStreamingAnswer }),
  clearPipelineDetail: () =>
    set({ pipelineThinkingText: '', pipelineSearchTargets: [], pipelineStreamingAnswer: false }),
  setError: (error) =>
    set((state) => ({
      error,
      stage: error ? 'error' : state.stage === 'error' ? 'idle' : state.stage
    })),
  setSpeechError: (speechError) => set({ speechError }),
  setBlurAnimateMessageId: (blurAnimateMessageId) => set({ blurAnimateMessageId }),
  markBlurAnimationDone: (id) =>
    set((state) => ({
      blurAnimateMessageId:
        state.blurAnimateMessageId === id ? null : state.blurAnimateMessageId,
      blurAnimatedMessageIds: state.blurAnimatedMessageIds.includes(id)
        ? state.blurAnimatedMessageIds
        : [...state.blurAnimatedMessageIds, id]
    })),
  resetPipeline: () =>
    set({
      stage: 'idle',
      error: null,
      speechError: null,
      blurAnimateMessageId: null,
      blurAnimatedMessageIds: [],
      queueAheadPreview: null,
      pipelineThinkingText: '',
      pipelineSearchTargets: [],
      pipelineStreamingAnswer: false
    })
}))
