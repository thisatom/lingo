import { Mic, Square } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { TooltipWrap } from '@/shared/ui/tooltip-wrap'

export type VoiceInteractionMode = 'hold' | 'toggle'

interface VoiceRecordButtonProps {
  isListening: boolean
  disabled?: boolean
  onPress: () => void
  onRelease: () => void
  className?: string
  variant?: 'secondary' | 'ghost' | 'destructive'
  /** `toggle`: tap to start / tap to stop (conversation loop). `hold`: push-to-talk. */
  interactionMode?: VoiceInteractionMode
}

export function VoiceRecordButton({
  isListening,
  disabled,
  onPress,
  onRelease,
  className,
  variant,
  interactionMode = 'hold'
}: VoiceRecordButtonProps) {
  const isToggle = interactionMode === 'toggle'
  const label = isListening
    ? isToggle
      ? 'Tap to send'
      : 'Release to send'
    : isToggle
      ? 'Tap to speak'
      : 'Hold to speak'

  const button = (
    <Button
      type="button"
      variant={isListening ? 'destructive' : (variant ?? 'secondary')}
      size="icon"
      className={cn('shrink-0', isListening && 'animate-pulse', className)}
      disabled={disabled}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault()
        if (disabled) return
        if (isToggle) {
          if (isListening) onRelease()
          else onPress()
        } else if (!isListening) {
          onPress()
        }
      }}
      onPointerUp={(e) => {
        e.preventDefault()
        if (disabled || isToggle) return
        if (isListening) onRelease()
      }}
      onPointerLeave={() => {
        if (disabled || isToggle) return
        if (isListening) onRelease()
      }}
      onClick={(e) => e.preventDefault()}
    >
      {isListening ? <Square className="fill-current" /> : <Mic />}
    </Button>
  )

  return (
    <TooltipWrap label={label}>
      {disabled ? <span className="inline-flex">{button}</span> : button}
    </TooltipWrap>
  )
}
