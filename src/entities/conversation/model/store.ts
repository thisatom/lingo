import { create } from 'zustand'

export type PipelineStage =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'error'

interface ConversationState {
  stage: PipelineStage
  error: string | null
  /** Latest assistant message id pending BlurText (once) */
  blurAnimateMessageId: string | null
  /** Ids that already played blur animation */
  blurAnimatedMessageIds: string[]
  setStage: (stage: PipelineStage) => void
  setError: (error: string | null) => void
  setBlurAnimateMessageId: (id: string | null) => void
  markBlurAnimationDone: (id: string) => void
  resetPipeline: () => void
}

export const useConversationStore = create<ConversationState>((set) => ({
  stage: 'idle',
  error: null,
  blurAnimateMessageId: null,
  blurAnimatedMessageIds: [],
  setStage: (stage) => set({ stage }),
  setError: (error) =>
    set((state) => ({
      error,
      stage: error ? 'error' : state.stage === 'error' ? 'idle' : state.stage
    })),
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
    set({ stage: 'idle', error: null, blurAnimateMessageId: null, blurAnimatedMessageIds: [] })
}))
