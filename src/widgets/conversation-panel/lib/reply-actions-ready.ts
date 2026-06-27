import type { PipelineStage } from '@/entities/conversation/model/store'

/** Copy / Continue / Speak appear only after the agent finishes the current turn. */
export function isReplyActionsReady(options: {
  agentBusy: boolean
  pipelineStreamingAnswer: boolean
  stage: PipelineStage
}): boolean {
  void options.stage
  if (options.pipelineStreamingAnswer) return false
  if (options.agentBusy) return false
  return true
}
