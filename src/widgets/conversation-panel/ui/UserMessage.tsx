import { useEffect, useRef, useState } from 'react'
import { ArrowUp, X } from 'lucide-react'
import { UserQuestionContextMenu } from './chat-context-menu/UserQuestionContextMenu'
import { MessageBodyClamp } from './MessageBodyClamp'
import { UserMessageEditButton } from './UserMessageEditButton'
import { userMessageBubbleClass, userMessageTextClass } from './agent-layout'
import { cn } from '@/shared/lib/utils'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

const INPUT_MIN_HEIGHT_PX = 42

function resizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = `${INPUT_MIN_HEIGHT_PX}px`
  const next = Math.min(Math.max(el.scrollHeight, INPUT_MIN_HEIGHT_PX), 160)
  el.style.height = `${next}px`
}

interface UserMessageProps {
  messageId: string
  content: string
  chatId: string | null
  disabled?: boolean
  isEditing: boolean
  onEnterEdit: () => void
  onExitEdit: () => void
  onSubmitEdit: (text: string) => void
}

export function UserMessage({
  messageId,
  content,
  chatId,
  disabled,
  isEditing,
  onEnterEdit,
  onExitEdit,
  onSubmitEdit
}: UserMessageProps) {
  const [draft, setDraft] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setDraft(content)
      return
    }
    setDraft(content)
    const el = textareaRef.current
    if (el) {
      resizeTextarea(el)
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    }
  }, [isEditing, content, messageId])

  const canSend = draft.trim().length > 0 && !disabled

  const handleSubmit = () => {
    if (!canSend) return
    onSubmitEdit(draft.trim())
    onExitEdit()
  }

  const handleCancel = () => {
    setDraft(content)
    onExitEdit()
  }

  if (isEditing) {
    return (
      <div className="group/message w-full min-w-0 max-w-full" data-user-message-edit>
        <div
          className={cn(
            'grid min-h-[42px] w-full max-w-full grid-cols-[24px_1fr_24px] items-center gap-1',
            userMessageBubbleClass,
            'px-2',
            'transition-colors focus-within:border-muted-foreground/40',
            disabled && 'opacity-60'
          )}
        >
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
              'max-h-40 min-h-[42px] w-full resize-none bg-transparent px-1',
              'text-[13px] leading-[1.5] text-foreground placeholder:text-muted-foreground',
              'outline-none disabled:cursor-not-allowed',
              'py-[11px]'
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
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <UserQuestionContextMenu prompt={content} chatId={chatId} className={userMessageBubbleClass}>
        <MessageBodyClamp bodyClassName="pr-9">
          <p className={cn(userMessageTextClass, 'whitespace-pre-wrap')}>{content}</p>
        </MessageBodyClamp>
        <UserMessageEditButton disabled={disabled} onEdit={onEnterEdit} />
      </UserQuestionContextMenu>
    </div>
  )
}