import { Mic, Square } from '@/shared/ui/icons'
import { Button, type ButtonProps } from '@/shared/ui/button'
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
  label?: string
  highlight?: boolean
  /** `toggle`: tap to start / tap to stop (conversation loop). `hold`: push-to-talk. */
  interactionMode?: VoiceInteractionMode
  size?: ButtonProps['size']
}

export function VoiceRecordButton({
  isListening,
  disabled,
  onPress,
  onRelease,
  className,
  variant,
  label: labelOverride,
  highlight = false,
  interactionMode = 'hold',
  size = 'icon'
}: VoiceRecordButtonProps) {
  const isToggle = interactionMode === 'toggle'
  const label =
    labelOverride ??
    (isListening
      ? isToggle
        ? 'Tap to send'
        : 'Release to send'
      : isToggle
        ? 'Tap to speak'
        : 'Hold to speak')

  const button = (
    <Button
      type="button"
      variant={isListening ? 'destructive' : (variant ?? 'secondary')}
      size={size}
      className={cn(
        'shrink-0',
        isListening && 'animate-pulse',
        highlight && !isListening && 'text-emerald-500/90',
        className
      )}
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
