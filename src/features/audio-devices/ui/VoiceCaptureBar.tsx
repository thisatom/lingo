import { Check, X } from '@/shared/ui/icons'
import { useAudioLevelMonitor } from '@/features/audio-devices/model/useAudioLevelMonitor'
import { MicLevelVisualizer } from '@/features/audio-devices/ui/MicLevelVisualizer'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

interface VoiceCaptureBarProps {
  active: boolean
  deviceId?: string
  deviceLabel?: string
  stream?: MediaStream | null
  onCancel: () => void
  onConfirm: () => void
  className?: string
}

export function VoiceCaptureBar({
  active,
  deviceId,
  deviceLabel,
  stream,
  onCancel,
  onConfirm,
  className
}: VoiceCaptureBarProps) {
  const { levels, isReceiving, durationLabel } = useAudioLevelMonitor({
      active,
      deviceId,
      deviceLabel,
      stream
    })

  if (!active) return null

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border border-border bg-chat-composer px-3 py-2',
        className
      )}
      role="region"
      aria-label="Voice recording"
    >
      <MicLevelVisualizer levels={levels} isReceiving={isReceiving} />

      <span className="inline-block w-10 shrink-0 text-center text-xs leading-none tabular-nums text-foreground">
        {durationLabel}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
        aria-label="Cancel recording"
        onClick={onCancel}
      >
        <X className="size-4" />
      </Button>

      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="size-8 shrink-0 rounded-full"
        aria-label="Finish recording"
        onClick={onConfirm}
      >
        <Check className="size-4" />
      </Button>
    </div>
  )
}
