import type { PipelineStage } from '@/entities/conversation/model/store'

/**
 * Target phases for the chat agent turn state machine (phase 2+).
 * Voice stages (`listening`, `transcribing`) stay in the voice layer.
 */
export type AgentTurnPhase =
  | 'idle'
  | 'preparing'
  | 'searching'
  | 'streaming'
  | 'speaking'

const BUSY_PIPELINE_STAGES: PipelineStage[] = ['thinking', 'searching', 'speaking']

/** Maps UI pipeline stage to agent turn phase (approximation until full controller). */
export function pipelineStageToAgentPhase(stage: PipelineStage): AgentTurnPhase {
  switch (stage) {
    case 'searching':
      return 'searching'
    case 'speaking':
      return 'speaking'
    case 'thinking':
      return 'streaming'
    case 'idle':
    case 'listening':
    case 'transcribing':
    case 'error':
    default:
      return 'idle'
  }
}

export function isBusyPipelineStage(stage: PipelineStage): boolean {
  return BUSY_PIPELINE_STAGES.includes(stage)
}

/** Agent turn in progress (not idle / voice-only stages). */
export function isBusyAgentPhase(phase: AgentTurnPhase): boolean {
  return phase !== 'idle'
}
