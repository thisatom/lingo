import { ShinyText } from '@/shared/ui/shiny-text'
import type { PipelineStage } from '@/entities/conversation/model/store'
import { agentMessageClass } from './agent-layout'

const STAGE_LABEL: Partial<Record<PipelineStage, string>> = {
  listening: 'Listening…',
  transcribing: 'Transcribing…',
  thinking: 'Thinking…',
  searching: 'Web searching…',
  speaking: 'Speaking…'
}

interface AgentStatusProps {
  stage: PipelineStage
}

export function AgentStatus({ stage }: AgentStatusProps) {
  const label = STAGE_LABEL[stage]
  if (!label) return null

  return (
    <div className={agentMessageClass} role="status" aria-live="polite" aria-label={label}>
      <ShinyText
        text={label}
        className="text-sm font-medium"
        color="#6b6b6b"
        shineColor="#d4d4d4"
        speed={2.2}
        spread={110}
      />
    </div>
  )
}
