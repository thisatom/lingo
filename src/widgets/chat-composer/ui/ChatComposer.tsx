import { useEffect, useMemo, useRef } from 'react'
import { Globe, Mic } from '@/shared/ui/icons'
import { ArrowUp, Square } from 'lucide-react'
import {
  EMPTY_COMPOSER_ATTACHMENTS,
  type MessageAttachment
} from '@/entities/message/model/attachment'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import { ComposerAttachments } from '@/features/chat-attachments/ui/ComposerAttachments'
import { ComposerTextareaContextMenu } from '@/features/chat-composer/ui/ComposerTextareaContextMenu'
import { ComposerFileInput } from '@/features/chat-attachments/ui/ComposerFileInput'
import { useComposerPaste } from '@/features/chat-attachments/model/useComposerPaste'
import { useNativeComposerDrop } from '@/features/chat-attachments/model/useNativeComposerDrop'
import { useSettingsStore } from '@/entities/settings/model/store'
import { VoiceRecordButton, type VoiceInteractionMode } from '@/features/voice-capture/ui/VoiceRecordButton'
import { composerInputHoverClass } from '@/shared/lib/sidebar-filter-menu-styles'
import { CHAT_MODE_LABELS, composerToolbarIconClass } from '@/widgets/chat-composer/lib/composer-toolbar'
import { ComposerAgentMenuSelect } from '@/widgets/chat-composer/ui/ComposerAgentMenuSelect'
import { mergeOpenRouterModelIds } from '@/shared/lib/openrouter-models'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

const INPUT_MIN_HEIGHT_PX = 24

const composerShellClass = cn(
  'flex w-full flex-col overflow-hidden rounded-3xl border border-border bg-chat-composer',
  'transition-[border-color] duration-150',
  'focus-within:border-ring/70',
  'has-[:focus-visible]:border-ring/70'
)

interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  attachments?: readonly MessageAttachment[]
  onAddAttachments?: (items: MessageAttachment[]) => void
  onRemoveAttachment?: (id: string) => void
  onAttachmentError?: (message: string) => void
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
  /** When this id changes, focus the composer textarea. */
  focusChatId?: string | null
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

function noopAddAttachments(_items: MessageAttachment[]): void {
  // no-op when attachments are disabled
}

function resizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = `${Math.max(el.scrollHeight, INPUT_MIN_HEIGHT_PX)}px`
}

export function ChatComposer({
  value,
  onChange,
  attachments = EMPTY_COMPOSER_ATTACHMENTS,
  onAddAttachments,
  onRemoveAttachment,
  onAttachmentError,
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
  focusChatId
}: ChatComposerProps) {
  const chatComposerMode = useSettingsStore((s) => s.chatComposerMode)
  const setChatComposerMode = useSettingsStore((s) => s.setChatComposerMode)
  const llmBackend = useSettingsStore((s) => s.llmBackend)
  const modelId = useSettingsStore((s) => s.modelId)
  const customModelId = useSettingsStore((s) => s.customModelId)
  const customModels = useSettingsStore((s) => s.customModels ?? [])
  const setModelId = useSettingsStore((s) => s.setModelId)
  const modelAutoFallback = useSettingsStore((s) => s.modelAutoFallback)
  const setModelAutoFallback = useSettingsStore((s) => s.setModelAutoFallback)
  const webSearchEnabled = useSettingsStore((s) => s.webSearchEnabled)
  const setWebSearchEnabled = useSettingsStore((s) => s.setWebSearchEnabled)

  const activeModelId = llmBackend === 'custom' ? customModelId : modelId

  const modelOptionIds = useMemo(
    () =>
      llmBackend === 'custom'
        ? [customModelId].filter(Boolean)
        : mergeOpenRouterModelIds(customModels, modelId),
    [llmBackend, customModels, customModelId, modelId]
  )

  const modeSelectOptions = useMemo(
    () =>
      [
        { value: 'text' as const, label: CHAT_MODE_LABELS.text },
        { value: 'conversation' as const, label: CHAT_MODE_LABELS.conversation }
      ] as const,
    []
  )

  const canSend = !disabled && (value.trim().length > 0 || attachments.length > 0)
  const { zoneRef, dragOver } = useNativeComposerDrop({
    enabled: !disabled && Boolean(onAddAttachments),
    existingCount: attachments.length,
    onAdd: onAddAttachments ?? noopAddAttachments,
    onError: onAttachmentError
  })
  const showStop = Boolean(
    onStop &&
      !canSend &&
      (agentBusy ||
        voiceBusy ||
        (liveConversationActive && chatComposerMode === 'conversation'))
  )
  const sendTooltip = agentBusy && canSend ? 'Send follow-up (queued)' : 'Send'
  const micLabel = voiceMicLabel(chatComposerMode, liveConversationActive, Boolean(isListening))
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useComposerPaste({
    textareaRef,
    enabled: !disabled && Boolean(onAddAttachments),
    existingCount: attachments.length,
    onAdd: onAddAttachments ?? noopAddAttachments,
    onError: onAttachmentError
  })

  useEffect(() => {
    const el = textareaRef.current
    if (el) resizeTextarea(el)
  }, [value])

  useEffect(() => {
    if (!focusChatId) return
    const frame = requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el || el.disabled) return
      el.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [focusChatId])

  return (
    <div className={cn('w-full shrink-0', !overlay && 'px-4 pb-4 pt-2')}>
      <div
        ref={zoneRef}
        className={cn(
          composerShellClass,
          disabled && 'opacity-60',
          dragOver && 'border-ring/80 bg-accent/50'
        )}
      >
        {attachments.length > 0 && onRemoveAttachment ? (
          <ComposerAttachments items={attachments} onRemove={onRemoveAttachment} />
        ) : null}
        <CustomScrollArea variant="menu" className="max-h-40 w-full">
          <ComposerTextareaContextMenu onValueChange={onChange} textareaRef={textareaRef}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={1}
              disabled={disabled}
              style={{ height: INPUT_MIN_HEIGHT_PX }}
              className={cn(
                'block min-h-6 w-full resize-none overflow-hidden bg-transparent',
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
          </ComposerTextareaContextMenu>
        </CustomScrollArea>

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
                <Square className="size-3.5 fill-current" strokeWidth={0} />
              </TooltipIconButton>
            ) : (
              <VoiceRecordButton
                variant="ghost"
                interactionMode={voiceInteractionMode}
                isListening={!!isListening}
                disabled={
                  disabled ||
                  voiceBusy ||
                  (agentBusy && !(liveConversationActive && chatComposerMode === 'conversation'))
                }
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

          {onAddAttachments ? (
            <ComposerFileInput
              existingCount={attachments.length}
              disabled={disabled}
              onAdd={onAddAttachments}
              onError={onAttachmentError}
            />
          ) : null}

          <TooltipIconButton
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              composerToolbarIconClass,
              webSearchEnabled && cn(composerInputHoverClass, 'bg-accent text-foreground')
            )}
            disabled={disabled}
            tooltip={webSearchEnabled ? 'Web search on' : 'Web search off'}
            aria-label={webSearchEnabled ? 'Web search on' : 'Web search off'}
            aria-pressed={webSearchEnabled}
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
          >
            <Globe className="size-4" />
          </TooltipIconButton>

          <ComposerAgentMenuSelect
            mode={chatComposerMode}
            llmBackend={llmBackend}
            modelId={activeModelId}
            modeOptions={modeSelectOptions}
            modelIds={modelOptionIds}
            modelAutoFallback={modelAutoFallback}
            onModeChange={setChatComposerMode}
            onModelChange={setModelId}
            onModelAutoFallbackChange={setModelAutoFallback}
            disabled={disabled}
          />

          <div className="min-w-0 flex-1" />

          {showStop ? (
            <TooltipIconButton
              size="iconSm"
              className="shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90"
              tooltip="Stop"
              onClick={onStop}
            >
              <Square className="size-3.5 fill-current" strokeWidth={0} />
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
              tooltip={sendTooltip}
              onClick={onSend}
            >
              <ArrowUp className="size-3.5" strokeWidth={2} />
            </TooltipIconButton>
          )}
        </div>
      </div>
    </div>
  )
}
