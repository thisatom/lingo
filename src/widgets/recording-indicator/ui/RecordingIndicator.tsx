import { ShinyText } from '@/shared/ui/shiny-text'
import { cn } from '@/shared/lib/utils'

interface RecordingIndicatorProps {
  isListening: boolean
  interimTranscript?: string
  isTranscribing?: boolean
  /** Shown after "release to …" while recording */
  releaseHint?: string
  className?: string
}

export function RecordingIndicator({
  isListening,
  interimTranscript,
  isTranscribing,
  releaseHint = 'send',
  className
}: RecordingIndicatorProps) {
  if (!isListening && !interimTranscript && !isTranscribing) return null

  const statusText = isListening
    ? `Recording… release to ${releaseHint}`
    : isTranscribing
      ? 'Transcribing…'
      : 'Heard:'

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-chat-user px-4 py-3',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full bg-foreground/70',
          (isListening || isTranscribing) && 'animate-pulse'
        )}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <ShinyText text={statusText} className="text-xs font-medium" speed={2.2} />
        {interimTranscript && (
          <p className="text-sm text-foreground italic">{interimTranscript}</p>
        )}
      </div>
    </div>
  )
}
