import { useEffect, useRef, useState } from 'react'
import { X } from '@/shared/ui/icons'
import { ArrowUp, Mic, Square } from 'lucide-react'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { SubmitEditedUserMessageResult } from '@/features/ai-chat/model/submit-edited-user-message'
import { useComposerPaste } from '@/features/chat-attachments/model/useComposerPaste'
import { ComposerAttachments } from '@/features/chat-attachments/ui/ComposerAttachments'
import { ComposerFileInput } from '@/features/chat-attachments/ui/ComposerFileInput'
import { UserQuestionContextMenu } from './chat-context-menu/UserQuestionContextMenu'
import { MessageBodyClamp } from './MessageBodyClamp'
import { UserMessageAttachments } from '@/features/chat-attachments/ui/UserMessageAttachments'
import type { EditSpeechTarget } from '@/widgets/conversation-panel/lib/edit-speech-target'
import { UserMessageActionButton } from './UserMessageActionButton'
import { MarkdownContent } from '@/shared/ui/markdown-content'
import { chatSelectableClass, userMessageBubbleClass } from './agent-layout'
import { cn } from '@/shared/lib/utils'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

const INPUT_MIN_HEIGHT_PX = 32

function resizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = `${INPUT_MIN_HEIGHT_PX}px`
  const next = Math.min(Math.max(el.scrollHeight, INPUT_MIN_HEIGHT_PX), 160)
  el.style.height = `${next}px`
}

interface UserMessageProps {
  messageId: string
  content: string
  attachments?: MessageAttachment[]
  chatId: string | null
  disabled?: boolean
  isEditing: boolean
  showStop?: boolean
  onStopAgent?: () => void
  onEnterEdit: () => void
  onExitEdit: () => void
  onSubmitEdit: (
    text: string,
    attachments?: MessageAttachment[]
  ) => Promise<SubmitEditedUserMessageResult>
  onAttachmentError?: (message: string) => void
  voiceSupported?: boolean
  voiceBusy?: boolean
  isVoiceListening?: boolean
  onVoicePress?: () => void
  onVoiceStop?: () => void
  onRegisterEditSpeech?: (target: EditSpeechTarget | null) => void
  /** Shown when Agent Speech capture has no transcript text yet. */
  voiceCaptureLabel?: 'listening' | 'transcribing' | null
}

export function UserMessage({
  messageId,
  content,
  attachments,
  chatId,
  disabled,
  isEditing,
  showStop,
  onStopAgent,
  onEnterEdit,
  onExitEdit,
  onSubmitEdit,
  onAttachmentError,
  voiceSupported,
  voiceBusy,
  isVoiceListening,
  onVoicePress,
  onVoiceStop,
  onRegisterEditSpeech,
  voiceCaptureLabel = null
}: UserMessageProps) {
  const [draft, setDraft] = useState(content)
  const [editAttachments, setEditAttachments] = useState<MessageAttachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const draftRef = useRef(draft)
  const editSessionIdRef = useRef<string | null>(null)
  draftRef.current = draft

  useEffect(() => {
    if (!isEditing) {
      editSessionIdRef.current = null
      setDraft(content)
      setEditAttachments(attachments ? [...attachments] : [])
      return
    }

    if (editSessionIdRef.current === messageId) return

    editSessionIdRef.current = messageId
    setDraft(content)
    setEditAttachments(attachments ? [...attachments] : [])
    const el = textareaRef.current
    if (el) {
      requestAnimationFrame(() => {
        resizeTextarea(el)
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
      })
    }
  }, [isEditing, content, messageId, attachments])

  useEffect(() => {
    if (!isEditing || !onRegisterEditSpeech) return

    onRegisterEditSpeech({
      messageId,
      setText: (text) => {
        setDraft(text)
        draftRef.current = text
        const el = textareaRef.current
        if (el) {
          requestAnimationFrame(() => resizeTextarea(el))
        }
      },
      getPrefix: () => draftRef.current
    })

    return () => onRegisterEditSpeech(null)
  }, [isEditing, messageId, onRegisterEditSpeech])

  useComposerPaste({
    textareaRef,
    enabled: isEditing && !disabled,
    existingCount: editAttachments.length,
    onAdd: (items) => setEditAttachments((prev) => [...prev, ...items]),
    onError: onAttachmentError
  })

  const hasAttachments = editAttachments.length > 0
  const canSend = (draft.trim().length > 0 || hasAttachments) && !disabled

  const handleAddAttachments = (items: MessageAttachment[]) => {
    setEditAttachments((prev) => [...prev, ...items])
  }

  const handleSubmit = () => {
    if (!canSend) return
    const text = draft.trim()
    const attachments = hasAttachments ? editAttachments : undefined
    onExitEdit()
    void onSubmitEdit(text, attachments)
  }

  const handleCancel = () => {
    setDraft(content)
    setEditAttachments(attachments ? [...attachments] : [])
    onExitEdit()
  }

  if (isEditing) {
    return (
      <div className="group/message w-full min-w-0 max-w-full" data-user-message-edit>
        <div
          className={cn(
            userMessageBubbleClass,
            'flex w-full max-w-full flex-col gap-2 px-2 py-2',
            'transition-colors focus-within:border-muted-foreground/40',
            disabled && 'opacity-60'
          )}
        >
          {hasAttachments ? (
            <ComposerAttachments
              items={editAttachments}
              onRemove={(id) => setEditAttachments((prev) => prev.filter((a) => a.id !== id))}
              className="px-0 pt-0 pb-0"
            />
          ) : null}

          <div className="grid min-h-8 w-full grid-cols-[24px_24px_24px_1fr_24px] items-center gap-1">
            <TooltipIconButton
              variant="ghost"
              size="iconSm"
              className="justify-self-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              tooltip="Cancel"
              disabled={disabled}
              onClick={handleCancel}
            >
              <X className="size-3.5" />
            </TooltipIconButton>

            <ComposerFileInput
              existingCount={editAttachments.length}
              disabled={disabled}
              onAdd={handleAddAttachments}
              onError={onAttachmentError}
            />

            {voiceSupported && onVoicePress && onVoiceStop ? (
              isVoiceListening ? (
                <TooltipIconButton
                  type="button"
                  variant="destructive"
                  size="iconSm"
                  className="justify-self-center rounded-full"
                  disabled={disabled || voiceBusy}
                  tooltip="Stop recording"
                  aria-label="Stop recording"
                  onClick={onVoiceStop}
                >
                  <Square className="size-3.5 fill-current" strokeWidth={0} />
                </TooltipIconButton>
              ) : (
                <TooltipIconButton
                  type="button"
                  variant="ghost"
                  size="iconSm"
                  className="justify-self-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  disabled={disabled || voiceBusy}
                  tooltip="Speak"
                  aria-label="Speak"
                  onClick={onVoicePress}
                >
                  <Mic className="size-3.5" strokeWidth={2} />
                </TooltipIconButton>
              )
            ) : (
              <TooltipIconButton
                type="button"
                variant="ghost"
                size="iconSm"
                className="justify-self-center rounded-full text-muted-foreground"
                disabled
                tabIndex={-1}
                tooltip="Speech unavailable"
                aria-label="Speech unavailable"
              >
                <Mic className="size-3.5" strokeWidth={2} />
              </TooltipIconButton>
            )}

            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                resizeTextarea(e.currentTarget)
              }}
              rows={1}
              disabled={disabled}
              style={{ height: INPUT_MIN_HEIGHT_PX }}
              className={cn(
                chatSelectableClass,
                'max-h-40 min-h-8 w-full resize-none bg-transparent px-1 py-1',
                'text-[13px] leading-[1.5] text-foreground placeholder:text-muted-foreground',
                'outline-none disabled:cursor-not-allowed'
              )}
              onInput={(e) => resizeTextarea(e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (canSend) handleSubmit()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  handleCancel()
                }
              }}
            />

            <TooltipIconButton
              size="iconSm"
              className={cn(
                'justify-self-center rounded-full transition-colors',
                canSend
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : 'bg-muted text-muted-foreground'
              )}
              disabled={!canSend}
              tooltip="Send"
              onClick={handleSubmit}
            >
              <ArrowUp className="size-3.5" strokeWidth={2} />
            </TooltipIconButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <UserQuestionContextMenu
        prompt={content}
        chatId={chatId}
        className={userMessageBubbleClass}
        activateDisabled={disabled}
        onActivate={onEnterEdit}
      >
        <MessageBodyClamp bodyClassName="pr-8">
          {attachments && attachments.length > 0 ? (
            <UserMessageAttachments attachments={attachments} />
          ) : null}
          {content.trim() ? (
            <MarkdownContent content={content} variant="user" />
          ) : voiceCaptureLabel ? (
            <p className="text-sm italic text-muted-foreground">
              {voiceCaptureLabel === 'transcribing' ? 'Transcribing…' : 'Listening…'}
            </p>
          ) : null}
        </MessageBodyClamp>
        <UserMessageActionButton
          mode={showStop ? 'stop' : 'edit'}
          disabled={disabled && !showStop}
          onClick={showStop ? () => onStopAgent?.() : onEnterEdit}
        />
      </UserQuestionContextMenu>
    </div>
  )
}
