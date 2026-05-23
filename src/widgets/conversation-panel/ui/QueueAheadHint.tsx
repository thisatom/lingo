import { CornerDownLeft } from '@/shared/ui/icons'
import { agentMessageClass } from './agent-layout'

interface QueueAheadHintProps {
  preview: string
}

export function QueueAheadHint({ preview }: QueueAheadHintProps) {
  return (
    <div
      className={agentMessageClass}
      role="status"
      aria-live="polite"
      aria-label={`Next in queue: ${preview}`}
    >
      <p className="text-[13px] leading-[1.5] text-muted-foreground">
        <span className="font-medium text-foreground">Next in queue</span>
        <CornerDownLeft className="mx-1 inline size-3 align-text-bottom opacity-70" aria-hidden />
        <span className="text-foreground/90">{preview}</span>
      </p>
    </div>
  )
}
