import { useSettingsStore } from '@/entities/settings/model/store'
import type { PipelineStage } from '@/entities/conversation/model/store'
import { SpeakingTtsLevel } from '@/features/text-to-speech/ui/SpeakingTtsLevel'
import { getWebSearchProvider } from '@/shared/lib/web-search-provider'
import { cn } from '@/shared/lib/utils'
import { ShinyText } from '@/shared/ui/shiny-text'
import { agentMessageClass } from './agent-layout'

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

  if (stage === 'searching') {
    const provider = getWebSearchProvider(modelId)
    return (
      <div
        className={agentMessageClass}
        role="status"
        aria-live="polite"
        aria-label={`Searching web via ${provider.label}`}
      >
        <span className="inline-flex flex-wrap items-baseline gap-x-1 text-[13px] leading-[1.5] font-normal">
          <ShinyText text="Searching web" className="inline" speed={2.2} spread={110} />
          <span className="text-muted-foreground">–</span>
          <a
            href={provider.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/75 underline-offset-2 hover:text-foreground hover:underline"
          >
            {provider.label}
          </a>
        </span>
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
