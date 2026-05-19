import { useEffect, useRef } from 'react'
import { ArrowUp, Mic, Square } from 'lucide-react'
import { VoiceRecordButton } from '@/features/voice-capture/ui/VoiceRecordButton'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

const INPUT_MIN_HEIGHT_PX = 42
const INPUT_MAX_HEIGHT_PX = 160

interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  disabled?: boolean
  voiceBusy?: boolean
  agentBusy?: boolean
  voiceSupported?: boolean
  isListening?: boolean
  onVoicePress?: () => void
  onVoiceRelease?: () => void
  placeholder?: string
  overlay?: boolean
}

function resizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  const next = Math.min(
    Math.max(el.scrollHeight, INPUT_MIN_HEIGHT_PX),
    INPUT_MAX_HEIGHT_PX
  )
  el.style.height = `${next}px`
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  disabled,
  voiceBusy,
  agentBusy,
  voiceSupported,
  isListening,
  onVoicePress,
  onVoiceRelease,
  placeholder = 'Send follow-up',
  overlay = false
}: ChatComposerProps) {
  const canSend = !disabled && value.trim().length > 0
  const showStop = Boolean(agentBusy && onStop && !canSend)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (el) resizeTextarea(el)
  }, [value])

  return (
    <div className={cn('shrink-0', !overlay && 'px-4 pb-4 pt-2')}>
      <div
        className={cn(
          'flex min-h-[42px] w-full items-end gap-2 rounded-2xl border border-border bg-chat-composer px-2',
          'transition-colors focus-within:border-muted-foreground/40',
          disabled && 'opacity-60'
        )}
      >
        {voiceSupported && onVoicePress && onVoiceRelease ? (
          <VoiceRecordButton
            variant="ghost"
            isListening={!!isListening}
            disabled={disabled || voiceBusy || agentBusy}
            onPress={onVoicePress}
            onRelease={onVoiceRelease}
            className="mb-1 size-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mb-1 size-8 shrink-0 rounded-full text-muted-foreground"
            disabled
            tabIndex={-1}
          >
            <Mic className="size-4" />
          </Button>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          style={{ height: INPUT_MIN_HEIGHT_PX }}
          className={cn(
            'max-h-40 min-h-[42px] w-full flex-1 resize-none overflow-y-auto bg-transparent',
            'px-1 py-[11px] text-sm leading-5 text-foreground placeholder:text-muted-foreground',
            'outline-none disabled:cursor-not-allowed'
          )}
          onInput={(e) => resizeTextarea(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (canSend) onSend()
            }
          }}
        />

        {showStop ? (
          <Button
            type="button"
            size="iconSm"
            className="mb-1 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90"
            onClick={onStop}
            title="Stop"
            aria-label="Stop agent"
          >
            <Square className="size-2 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="iconSm"
            className={cn(
              'mb-1 shrink-0 rounded-full transition-colors',
              canSend
                ? 'bg-foreground text-background hover:bg-foreground/90'
                : 'bg-muted text-muted-foreground'
            )}
            disabled={!canSend}
            onClick={onSend}
            title="Send"
          >
            <ArrowUp className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
