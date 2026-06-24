import { useEffect, useMemo, useRef } from 'react'
import { Globe, Mic } from '@/shared/ui/icons'
import { ArrowUp, Languages, Square, Upload } from 'lucide-react'
import {
  EMPTY_COMPOSER_ATTACHMENTS,
  type MessageAttachment
} from '@/entities/message/model/attachment'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import type { QueuedMessage } from '@/entities/message-queue/model/store'
import { ComposerFileInput } from '@/features/chat-attachments/ui/ComposerFileInput'
import { useComposerPaste } from '@/features/chat-attachments/model/useComposerPaste'
import { useNativeComposerDrop } from '@/features/chat-attachments/model/useNativeComposerDrop'
import { useSettingsStore } from '@/entities/settings/model/store'
import { VoiceRecordButton, type VoiceInteractionMode } from '@/features/voice-capture/ui/VoiceRecordButton'
import { composerInputHoverClass } from '@/shared/lib/sidebar-filter-menu-styles'
import { CHAT_MODE_LABELS, composerToolbarIconClass } from '@/widgets/chat-composer/lib/composer-toolbar'
import {
  composerStackPanelFlexShrinkClass,
  composerTextareaScrollClass
} from '@/widgets/chat-composer/lib/composer-stack-panel'
import { ComposerAgentMenuSelect } from '@/widgets/chat-composer/ui/ComposerAgentMenuSelect'
import { ComposerAttachmentsPanel } from '@/widgets/chat-composer/ui/ComposerAttachmentsPanel'
import { ChatMessageQueue } from '@/widgets/chat-composer/ui/ChatMessageQueue'
import { ComposerTextareaContextMenu } from '@/features/chat-composer/ui/ComposerTextareaContextMenu'
import { mergeOpenRouterModelIds } from '@/shared/lib/openrouter-models'
import { isElectronApp } from '@/shared/lib/lingo'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

const INPUT_MIN_HEIGHT_PX = 24

const composerShellClass = cn(
  'flex w-full max-h-[min(70dvh,calc(100dvh-5.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-chat-composer',
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
  queuedMessages?: readonly QueuedMessage[]
  onUpdateQueuedMessage?: (id: string, content: string) => void
  onRemoveQueuedMessage?: (id: string) => void
  onSendQueuedMessageNow?: (id: string) => void
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

function allowFileDragOver(event: React.DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

function onComposerTextareaDrop(event: React.DragEvent) {
  event.preventDefault()
  if (!isElectronApp()) {
    event.stopPropagation()
  }
}

export function ChatComposer({
  value,
  onChange,
  attachments = EMPTY_COMPOSER_ATTACHMENTS,
  onAddAttachments,
  onRemoveAttachment,
  onAttachmentError,
  queuedMessages,
  onUpdateQueuedMessage,
  onRemoveQueuedMessage,
  onSendQueuedMessageNow,
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
  const languagePracticeEnabled = useSettingsStore((s) => s.languagePracticeEnabled)
  const setLanguagePracticeEnabled = useSettingsStore((s) => s.setLanguagePracticeEnabled)

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
  const voiceAvailable = voiceSupported && onVoicePress && (onVoiceStop || onVoiceRelease)
  const attachmentsEnabled = Boolean(onAddAttachments)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { zoneRef, dragOver } = useNativeComposerDrop({
    enabled: attachmentsEnabled,
    existingCount: attachments.length,
    onAdd: onAddAttachments ?? noopAddAttachments,
    onError: onAttachmentError
  })
  const showDropOverlay = attachmentsEnabled && dragOver && !disabled
  const voiceDisabled =
    disabled ||
    voiceBusy ||
    (agentBusy && !(liveConversationActive && chatComposerMode === 'conversation'))
  const showStop = Boolean(
    onStop &&
      !canSend &&
      (agentBusy ||
        voiceBusy ||
        (liveConversationActive && chatComposerMode === 'conversation'))
  )
  const sendTooltip = agentBusy && canSend ? 'Send follow-up (queued)' : 'Send'
  const micLabel = voiceMicLabel(chatComposerMode, liveConversationActive, Boolean(isListening))

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
      if (!el || disabled) return
      el.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [focusChatId, disabled])

  const showAttachmentPanel = attachments.length > 0 && Boolean(onRemoveAttachment)
  const showQueuePanel =
    (queuedMessages?.length ?? 0) > 0 &&
    Boolean(onUpdateQueuedMessage && onRemoveQueuedMessage && onSendQueuedMessageNow)

  useEffect(() => {
    const shell = zoneRef.current
    if (!shell) return

    const syncTextareaHeight = () => {
      const el = textareaRef.current
      if (el) resizeTextarea(el)
    }

    syncTextareaHeight()
    const observer = new ResizeObserver(syncTextareaHeight)
    observer.observe(shell)
    return () => observer.disconnect()
  }, [showAttachmentPanel, showQueuePanel])

  return (
    <div className={cn('w-full shrink-0', !overlay && 'px-4 pb-4 pt-2')} data-composer-root>
      <div
        ref={zoneRef}
        className={cn(
          composerShellClass,
          'relative',
          '[app-region:no-drag]',
          disabled && 'opacity-60',
          dragOver && attachmentsEnabled && 'ring-2 ring-inset ring-ring/80'
        )}
      >
        {showDropOverlay ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-accent/60 backdrop-blur-[1px]"
            aria-hidden
          >
            <div className="flex flex-col items-center gap-1.5 px-4 text-center">
              <Upload className="size-6 text-foreground/80" strokeWidth={1.75} />
              <p className="text-sm font-medium text-foreground">Drop files to attach</p>
              <p className="text-xs text-muted-foreground">Images and text files</p>
            </div>
          </div>
        ) : null}

        {showQueuePanel ? (
          <div className={composerStackPanelFlexShrinkClass}>
            <ChatMessageQueue
              embedded
              items={queuedMessages!}
              onUpdate={onUpdateQueuedMessage!}
              onRemove={onRemoveQueuedMessage!}
              onSendNow={onSendQueuedMessageNow!}
            />
          </div>
        ) : null}

        {showAttachmentPanel ? (
          <div className={composerStackPanelFlexShrinkClass}>
            <ComposerAttachmentsPanel
              embedded
              items={attachments}
              onRemove={onRemoveAttachment!}
            />
          </div>
        ) : null}

        <CustomScrollArea variant="menu" className={composerTextareaScrollClass}>
          <ComposerTextareaContextMenu onValueChange={onChange} textareaRef={textareaRef}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                if (disabled) return
                onChange(e.target.value)
              }}
              placeholder={placeholder}
              rows={1}
              readOnly={disabled}
              aria-disabled={disabled}
              style={{ height: INPUT_MIN_HEIGHT_PX }}
              className={cn(
                'block min-h-6 w-full resize-none overflow-hidden bg-transparent',
                'px-3.5 pt-3.5 pb-1 text-sm leading-5 text-foreground placeholder:text-muted-foreground',
                'outline-none',
                disabled && 'cursor-not-allowed'
              )}
              onInput={(e) => resizeTextarea(e.currentTarget)}
              onDragEnter={allowFileDragOver}
              onDragOver={allowFileDragOver}
              onDrop={onComposerTextareaDrop}
              onKeyDown={(e) => {
                if (disabled) return
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (canSend) onSend()
                }
              }}
            />
          </ComposerTextareaContextMenu>
        </CustomScrollArea>

        <div className="flex shrink-0 items-center gap-0.5 px-2 pb-2 pt-0.5">
          {!voiceAvailable ? (
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              className={composerToolbarIconClass}
              disabled
              tabIndex={-1}
            >
              <Mic />
            </Button>
          ) : null}

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
            size="iconSm"
            className={cn(
              composerToolbarIconClass,
              languagePracticeEnabled && cn(composerInputHoverClass, 'bg-accent text-foreground')
            )}
            disabled={disabled}
            tooltip={
              languagePracticeEnabled
                ? 'Language practice on'
                : 'General chat — language practice off'
            }
            aria-label={
              languagePracticeEnabled ? 'Language practice on' : 'Language practice off'
            }
            aria-pressed={languagePracticeEnabled}
            onClick={() => setLanguagePracticeEnabled(!languagePracticeEnabled)}
          >
            <Languages className="size-4" strokeWidth={1.75} />
          </TooltipIconButton>

          <TooltipIconButton
            type="button"
            variant="ghost"
            size="iconSm"
            className={cn(
              composerToolbarIconClass,
              webSearchEnabled && cn(composerInputHoverClass, 'bg-accent text-foreground')
            )}
            disabled={disabled}
            tooltip={
              webSearchEnabled
                ? 'Web search on'
                : 'Web search off — say "search the web for…" to force lookup'
            }
            tooltipSide="top"
            tooltipClassName="w-fit max-w-none px-2 py-1 text-left [text-wrap:pretty]"
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
          ) : canSend ? (
            <TooltipIconButton
              size="iconSm"
              className="shrink-0 rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90"
              tooltip={sendTooltip}
              onClick={onSend}
            >
              <ArrowUp className="size-3.5" strokeWidth={2} />
            </TooltipIconButton>
          ) : voiceAvailable ? (
            isListening && onVoiceStop ? (
              <TooltipIconButton
                type="button"
                variant="destructive"
                size="iconSm"
                className="shrink-0 rounded-full animate-pulse"
                disabled={disabled}
                tooltip="Stop recording"
                aria-label="Stop recording"
                onClick={onVoiceStop}
              >
                <Square className="size-3.5 fill-current" strokeWidth={0} />
              </TooltipIconButton>
            ) : (
              <VoiceRecordButton
                variant="secondary"
                size="iconSm"
                interactionMode={voiceInteractionMode}
                isListening={!!isListening}
                disabled={voiceDisabled}
                label={micLabel}
                highlight={liveConversationActive && chatComposerMode === 'conversation'}
                onPress={onVoicePress}
                onRelease={onVoiceStop ?? onVoiceRelease ?? (() => undefined)}
                className={cn(
                  'shrink-0 rounded-full',
                  liveConversationActive &&
                    chatComposerMode === 'conversation' &&
                    !isListening &&
                    'ring-1 ring-emerald-500/50'
                )}
              />
            )
          ) : (
            <TooltipIconButton
              size="iconSm"
              className="shrink-0 rounded-full bg-muted text-muted-foreground"
              disabled
              tooltip="Send"
            >
              <ArrowUp className="size-3.5" strokeWidth={2} />
            </TooltipIconButton>
          )}
        </div>
      </div>
    </div>
  )
}
