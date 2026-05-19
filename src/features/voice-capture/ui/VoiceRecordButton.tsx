import { Mic, Square } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

interface VoiceRecordButtonProps {
  isListening: boolean
  disabled?: boolean
  onPress: () => void
  onRelease: () => void
  className?: string
  variant?: 'secondary' | 'ghost' | 'destructive'
}

export function VoiceRecordButton({
  isListening,
  disabled,
  onPress,
  onRelease,
  className,
  variant
}: VoiceRecordButtonProps) {
  return (
    <Button
      type="button"
      variant={isListening ? 'destructive' : (variant ?? 'secondary')}
      size="icon"
      className={cn('shrink-0', isListening && 'animate-pulse', className)}
      disabled={disabled}
      title={isListening ? 'Stop recording' : 'Hold to speak'}
      onPointerDown={(e) => {
        e.preventDefault()
        if (disabled) return
        onPress()
      }}
      onPointerUp={(e) => {
        e.preventDefault()
        if (isListening) onRelease()
      }}
      onPointerLeave={() => {
        if (isListening) onRelease()
      }}
      onClick={(e) => e.preventDefault()}
    >
      {isListening ? <Square className="fill-current" /> : <Mic />}
    </Button>
  )
}
