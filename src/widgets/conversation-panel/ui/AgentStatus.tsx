import { useSettingsStore } from '@/entities/settings/model/store'
import type { PipelineStage } from '@/entities/conversation/model/store'
import { SpeakingTtsLevel } from '@/features/text-to-speech/ui/SpeakingTtsLevel'
import { isLocalWebSearchRegistered } from '@/shared/lib/local-web-search-runtime'
import { getWebSearchProvider } from '@/shared/lib/web-search-provider'
import { useConversationStore } from '@/entities/conversation/model/store'
import { cn } from '@/shared/lib/utils'
import { ShinyText } from '@/shared/ui/shiny-text'
import { agentMessageClass } from './agent-layout'
import { SearchTargetList } from './PipelineDetailPanels'

const STAGE_LABEL: Partial<Record<PipelineStage, string>> = {
  listening: 'Listening…',
  transcribing: 'Transcribing…',
  thinking: 'Thinking…',
  speaking: 'Speaking…'
}

interface AgentStatusProps {
  stage: PipelineStage
}

export function AgentStatus({ stage }: AgentStatusProps) {
  const modelId = useSettingsStore((s) => s.modelId)
  const pipelineSearchTargets = useConversationStore((s) => s.pipelineSearchTargets)

  if (stage === 'searching') {
    const local = isLocalWebSearchRegistered()
    const provider = getWebSearchProvider(modelId, { local })
    const targets =
      pipelineSearchTargets.length > 0
        ? pipelineSearchTargets
        : [{ title: provider.label, url: provider.href }]

    return (
      <div
        className={agentMessageClass}
        role="status"
        aria-live="polite"
        aria-label={local ? 'Researching the web' : `Searching web via ${provider.label}`}
      >
        <ShinyText
          text={local ? 'Researching the web' : 'Searching web'}
          className="text-[13px] leading-[1.5] font-normal"
          speed={2.2}
          spread={110}
        />
        <p className="mt-1 text-[12px] text-muted-foreground">Looking on:</p>
        <SearchTargetList targets={targets} />
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
