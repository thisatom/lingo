import type { PipelineStage } from '@/entities/conversation/model/store'
import { SpeakingTtsLevel } from '@/features/text-to-speech/ui/SpeakingTtsLevel'
import { useConversationStore } from '@/entities/conversation/model/store'
import { hostFromUrl, isBrowsableSearchTarget } from '@/shared/lib/web-search-targets'
import { cn } from '@/shared/lib/utils'
import { ShinyText } from '@/shared/ui/shiny-text'
import { agentMessageClass } from './agent-layout'
import { SearchTargetList } from './PipelineDetailPanels'

const STAGE_LABEL: Partial<Record<PipelineStage, string>> = {
  listening: 'Listening',
  transcribing: 'Transcribing',
  thinking: 'Thinking',
  speaking: 'Speaking'
}

interface AgentStatusProps {
  stage: PipelineStage
}

export function AgentStatus({ stage }: AgentStatusProps) {
  const pipelineSearchTargets = useConversationStore((s) => s.pipelineSearchTargets)
  const pipelineSearchActiveUrl = useConversationStore((s) => s.pipelineSearchActiveUrl)

  if (stage === 'searching') {
    const targets = pipelineSearchTargets.filter(isBrowsableSearchTarget)
    const activeHost = pipelineSearchActiveUrl ? hostFromUrl(pipelineSearchActiveUrl) : null

    return (
      <div
        className={agentMessageClass}
        role="status"
        aria-live="polite"
        aria-label="Search web"
      >
        <ShinyText
          text={activeHost ? `Search web · ${activeHost}` : 'Search web'}
          className="text-[13px] leading-[1.5] font-normal"
          speed={2.2}
          spread={110}
        />
        {targets.length > 0 ? <SearchTargetList targets={targets} /> : null}
      </div>
    )
  }

  const label = STAGE_LABEL[stage]
  if (!label) return null

  if (stage === 'speaking') {
    return (
      <div
        className={cn(agentMessageClass, 'flex items-center gap-2.5')}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <ShinyText
          text={label}
          className="shrink-0 text-[13px] leading-[1.5] font-normal"
          speed={2.2}
          spread={110}
        />
        <SpeakingTtsLevel />
      </div>
    )
  }

  return (
    <div className={agentMessageClass} role="status" aria-live="polite" aria-label={label}>
      <ShinyText text={label} className="text-[13px] leading-[1.5] font-normal" speed={2.2} spread={110} />
    </div>
  )
}
