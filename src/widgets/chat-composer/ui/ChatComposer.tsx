import { useEffect, useRef } from 'react'
import { ArrowUp, Globe, Mic, Square } from 'lucide-react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { VoiceRecordButton, type VoiceInteractionMode } from '@/features/voice-capture/ui/VoiceRecordButton'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

const INPUT_MIN_HEIGHT_PX = 24
const INPUT_MAX_HEIGHT_PX = 160

const composerShellClass = cn(
  'flex w-full flex-col overflow-hidden rounded-3xl border border-[#313131] bg-[#1e1e1e]',
  'transition-[border-color] duration-150',
  'focus-within:border-[#383838]',
  'has-[:focus-visible]:border-[#383838]'
)

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
  /** Stop an active voice session (mic recording). */
  onVoiceStop?: () => void
  onVoiceRelease?: () => void
  voiceInteractionMode?: VoiceInteractionMode
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
  onVoiceStop,
  onVoiceRelease,
  voiceInteractionMode = 'toggle',
  placeholder = 'Send follow-up',
  overlay = false
}: ChatComposerProps) {
  const chatComposerMode = useSettingsStore((s) => s.chatComposerMode)
  const setChatComposerMode = useSettingsStore((s) => s.setChatComposerMode)
  const webSearchEnabled = useSettingsStore((s) => s.webSearchEnabled)
  const setWebSearchEnabled = useSettingsStore((s) => s.setWebSearchEnabled)

  const canSend = !disabled && value.trim().length > 0
  const showStop = Boolean(agentBusy && onStop && !canSend)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (el) resizeTextarea(el)
  }, [value])

  return (
    <div className={cn('shrink-0', !overlay && 'px-4 pb-4 pt-2')}>
      <div className={cn(composerShellClass, disabled && 'opacity-60')}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          style={{ height: INPUT_MIN_HEIGHT_PX }}
          className={cn(
            'max-h-40 min-h-6 w-full resize-none overflow-y-auto bg-transparent',
            'px-3.5 pt-3.5 pb-1 text-sm leading-5 text-foreground placeholder:text-muted-foreground',
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

        <div className="flex shrink-0 items-center gap-1 px-2 pb-2 pt-0.5">
          {voiceSupported && onVoicePress && (onVoiceStop || onVoiceRelease) ? (
            isListening && onVoiceStop ? (
              <TooltipIconButton
                type="button"
                variant="destructive"
                size="icon"
                className="size-8 shrink-0 animate-pulse rounded-full"
                disabled={disabled}
                tooltip="Stop recording"
                aria-label="Stop recording"
                onClick={onVoiceStop}
              >
                <Square className="size-3 fill-current" />
              </TooltipIconButton>
            ) : (
              <VoiceRecordButton
                variant="ghost"
                interactionMode={voiceInteractionMode}
                isListening={!!isListening}
                disabled={disabled || voiceBusy || agentBusy}
                onPress={onVoicePress}
                onRelease={onVoiceStop ?? onVoiceRelease ?? (() => undefined)}
                className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              />
            )
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-full text-muted-foreground"
              disabled
              tabIndex={-1}
            >
              <Mic className="size-4" />
            </Button>
          )}

          <TooltipIconButton
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'size-8 shrink-0 rounded-full',
              webSearchEnabled
                ? 'bg-[#252525] text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
            disabled={disabled}
            tooltip={webSearchEnabled ? 'Web search on' : 'Web search off'}
            aria-label={webSearchEnabled ? 'Web search on' : 'Web search off'}
            aria-pressed={webSearchEnabled}
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
          >
            <Globe className="size-4" />
          </TooltipIconButton>

          <div className="min-w-0 flex-1" />

          <Select
            value={chatComposerMode}
            onValueChange={(v) => setChatComposerMode(v as 'text' | 'conversation')}
            disabled={disabled}
          >
            <SelectTrigger
              size="sm"
              aria-label="Chat mode"
              className="h-7 w-auto max-w-[6.75rem] shrink-0 cursor-pointer gap-1.5 border-0 bg-transparent px-1.5 text-[11px] leading-none shadow-none hover:bg-[#252525] focus-visible:ring-1 [&_svg]:ml-0.5 [&_svg]:size-3"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="end"
              className="min-w-[11rem] border-border/60 bg-[#181818] p-0.5 text-popover-foreground"
            >
              <SelectItem
                value="text"
                className="h-7 cursor-pointer py-0 pr-8 pl-1.5 text-xs [&_[data-slot=select-item-indicator]]:right-2"
                suffix={
                  <KbdGroup className="ml-auto mr-1 opacity-70" aria-hidden>
                    <Kbd>Ctrl</Kbd>
                    <Kbd>Shift</Kbd>
                    <Kbd>T</Kbd>
                  </KbdGroup>
                }
              >
                Text
              </SelectItem>
              <SelectItem
                value="conversation"
                className="h-7 cursor-pointer py-0 pr-8 pl-1.5 text-xs [&_[data-slot=select-item-indicator]]:right-2"
                suffix={
                  <KbdGroup className="ml-auto mr-1 opacity-70" aria-hidden>
                    <Kbd>Ctrl</Kbd>
                    <Kbd>Shift</Kbd>
                    <Kbd>V</Kbd>
                  </KbdGroup>
                }
              >
                Conversation
              </SelectItem>
            </SelectContent>
          </Select>

          {showStop ? (
            <TooltipIconButton
              size="iconSm"
              className="shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90"
              tooltip="Stop"
              onClick={onStop}
            >
              <Square className="size-2 fill-current" />
            </TooltipIconButton>
          ) : (
            <TooltipIconButton
              size="iconSm"
              className={cn(
                'shrink-0 rounded-full transition-colors',
                canSend
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : 'bg-muted text-muted-foreground'
              )}
              disabled={!canSend}
              tooltip="Send"
              onClick={onSend}
            >
              <ArrowUp className="size-3.5" />
            </TooltipIconButton>
          )}
        </div>
      </div>
    </div>
  )
}
