import type { PipelineStage } from '@/entities/conversation/model/store'

/** Copy / regenerate appear only after the assistant text stream finishes. */
export function isReplyActionsReady(options: {
  agentBusy: boolean
  pipelineStreamingAnswer: boolean
  stage: PipelineStage
}): boolean {
  if (options.pipelineStreamingAnswer) return false
  if (!options.agentBusy) return true
  return options.stage !== 'thinking' && options.stage !== 'searching'
}
