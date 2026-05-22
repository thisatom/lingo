import { useEffect, useRef, useState } from 'react'
import { ArrowUp, X } from '@/shared/ui/icons'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { useComposerPaste } from '@/features/chat-attachments/model/useComposerPaste'
import { ComposerAttachments } from '@/features/chat-attachments/ui/ComposerAttachments'
import { ComposerFileInput } from '@/features/chat-attachments/ui/ComposerFileInput'
import { UserQuestionContextMenu } from './chat-context-menu/UserQuestionContextMenu'
import { MessageBodyClamp } from './MessageBodyClamp'
import { UserMessageAttachments } from '@/features/chat-attachments/ui/UserMessageAttachments'
import { UserMessageEditButton } from './UserMessageEditButton'
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
  onEnterEdit: () => void
  onExitEdit: () => void
  onSubmitEdit: (text: string, attachments?: MessageAttachment[]) => void
  onAttachmentError?: (message: string) => void
}

export function UserMessage({
  messageId,
  content,
  attachments,
  chatId,
  disabled,
  isEditing,
  onEnterEdit,
  onExitEdit,
  onSubmitEdit,
  onAttachmentError
}: UserMessageProps) {
  const [draft, setDraft] = useState(content)
  const [editAttachments, setEditAttachments] = useState<MessageAttachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setDraft(content)
      setEditAttachments(attachments ? [...attachments] : [])
      return
    }
    setDraft(content)
    setEditAttachments(attachments ? [...attachments] : [])
    const el = textareaRef.current
    if (el) {
      resizeTextarea(el)
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    }
  }, [isEditing, content, messageId, attachments])

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
    onSubmitEdit(draft.trim(), editAttachments)
    onExitEdit()
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

          <div className="grid min-h-8 w-full grid-cols-[24px_24px_1fr_24px] items-center gap-1">
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
              <ArrowUp className="size-3.5" />
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
        onDoubleClick={() => {
          if (disabled) return
          onEnterEdit()
        }}
      >
        <MessageBodyClamp bodyClassName="pr-8">
          {attachments && attachments.length > 0 ? (
            <UserMessageAttachments attachments={attachments} />
          ) : null}
          {content.trim() ? (
            <MarkdownContent content={content} variant="agent" className={chatSelectableClass} />
          ) : null}
        </MessageBodyClamp>
        <UserMessageEditButton disabled={disabled} onEdit={onEnterEdit} />
      </UserQuestionContextMenu>
    </div>
  )
}
