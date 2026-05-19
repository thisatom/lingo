import { useEffect, useMemo, useRef } from 'react'
import { ArrowUp, Globe, Mic, Square } from 'lucide-react'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { VoiceRecordButton, type VoiceInteractionMode } from '@/features/voice-capture/ui/VoiceRecordButton'
import {
  CHAT_MODE_LABELS,
  composerSelectContentClass,
  composerSelectItemClass,
  composerModelSelectTriggerClass,
  composerSelectTriggerClass,
  composerToolbarIconClass
} from '@/widgets/chat-composer/lib/composer-toolbar'
import { ContextUsageButton } from '@/widgets/chat-composer/ui/ContextUsageButton'
import { shortOpenRouterModelLabel } from '@/widgets/chat-composer/lib/model-label'
import { openRouterSuggestedModels } from '@/shared/config/openrouter'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
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
  onVoiceStop?: () => void
  onVoiceRelease?: () => void
  voiceInteractionMode?: VoiceInteractionMode
  liveConversationActive?: boolean
  placeholder?: string
  overlay?: boolean
  contextUsagePercent?: number
  onResetContext?: () => void
}

function voiceMicLabel(
  mode: ChatComposerMode,
  live: boolean,
  listening: boolean
): string {
  if (mode === 'conversation') {
    if (listening) return 'Tap to send'
    if (live) return 'Tap to end live chat'
    return 'Tap to start live chat'
  }
  return listening ? 'Tap to finish' : 'Tap to speak'
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
  liveConversationActive = false,
  placeholder = 'Send follow-up',
  overlay = false,
  contextUsagePercent,
  onResetContext
}: ChatComposerProps) {
  const chatComposerMode = useSettingsStore((s) => s.chatComposerMode)
  const setChatComposerMode = useSettingsStore((s) => s.setChatComposerMode)
  const modelId = useSettingsStore((s) => s.modelId)
  const setModelId = useSettingsStore((s) => s.setModelId)
  const webSearchEnabled = useSettingsStore((s) => s.webSearchEnabled)
  const setWebSearchEnabled = useSettingsStore((s) => s.setWebSearchEnabled)

  const modelOptions = useMemo(() => {
    const ids = new Set<string>(openRouterSuggestedModels)
    if (modelId.trim()) ids.add(modelId.trim())
    return [...ids]
  }, [modelId])

  const canSend = !disabled && value.trim().length > 0
  const showStop = Boolean(agentBusy && onStop && !canSend)
  const micLabel = voiceMicLabel(chatComposerMode, liveConversationActive, Boolean(isListening))
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (el) resizeTextarea(el)
  }, [value])

  const showContext = contextUsagePercent != null && onResetContext

  return (
    <div className={cn('flex w-full shrink-0 flex-col gap-1.5', !overlay && 'px-4 pb-4 pt-2')}>
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

        <div className="flex shrink-0 items-center gap-0.5 px-2 pb-2 pt-0.5">
          {voiceSupported && onVoicePress && (onVoiceStop || onVoiceRelease) ? (
            isListening && onVoiceStop ? (
              <TooltipIconButton
                type="button"
                variant="destructive"
                size="icon"
                className={cn(composerToolbarIconClass, 'animate-pulse')}
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
                label={micLabel}
                highlight={liveConversationActive && chatComposerMode === 'conversation'}
                onPress={onVoicePress}
                onRelease={onVoiceStop ?? onVoiceRelease ?? (() => undefined)}
                className={cn(
                  composerToolbarIconClass,
                  liveConversationActive &&
                    chatComposerMode === 'conversation' &&
                    !isListening &&
                    'ring-1 ring-emerald-500/50'
                )}
              />
            )
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={composerToolbarIconClass}
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
              composerToolbarIconClass,
              webSearchEnabled && 'bg-[#303030] text-foreground'
            )}
            disabled={disabled}
            tooltip={webSearchEnabled ? 'Web search on' : 'Web search off'}
            aria-label={webSearchEnabled ? 'Web search on' : 'Web search off'}
            aria-pressed={webSearchEnabled}
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
          >
            <Globe className="size-4" />
          </TooltipIconButton>

          <Select
            value={chatComposerMode}
            onValueChange={(v) => setChatComposerMode(v as 'text' | 'conversation')}
            disabled={disabled}
          >
            <SelectTrigger size="sm" aria-label="Chat mode" className={composerSelectTriggerClass}>
              <span className="truncate leading-none">{CHAT_MODE_LABELS[chatComposerMode]}</span>
            </SelectTrigger>
            <SelectContent position="popper" align="start" className={composerSelectContentClass}>
              <SelectItem
                value="text"
                className={composerSelectItemClass}
                suffix={
                  <KbdGroup className="ml-auto mr-1 opacity-70" aria-hidden>
                    <Kbd>Ctrl</Kbd>
                    <Kbd>Shift</Kbd>
                    <Kbd>T</Kbd>
                  </KbdGroup>
                }
              >
                {CHAT_MODE_LABELS.text}
              </SelectItem>
              <SelectItem
                value="conversation"
                className={composerSelectItemClass}
                suffix={
                  <KbdGroup className="ml-auto mr-1 opacity-70" aria-hidden>
                    <Kbd>Ctrl</Kbd>
                    <Kbd>Shift</Kbd>
                    <Kbd>V</Kbd>
                  </KbdGroup>
                }
              >
                {CHAT_MODE_LABELS.conversation}
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="min-w-0 flex-1" />

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

      <div className="flex items-center justify-between gap-2 px-0.5">
        <Select value={modelId} onValueChange={setModelId} disabled={disabled}>
          <SelectTrigger
            size="sm"
            aria-label="AI model"
            className={composerModelSelectTriggerClass}
          >
            <span className="truncate leading-none">
              {shortOpenRouterModelLabel(modelId)}
            </span>
          </SelectTrigger>
          <SelectContent
            position="popper"
            align="start"
            className={cn(composerSelectContentClass, 'max-h-64 min-w-[14rem]')}
          >
            {modelOptions.map((id) => (
              <SelectItem key={id} value={id} className={composerSelectItemClass}>
                {id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showContext ? (
          <ContextUsageButton
            percent={contextUsagePercent}
            disabled={disabled}
            onReset={onResetContext}
          />
        ) : null}
      </div>
    </div>
  )
}
