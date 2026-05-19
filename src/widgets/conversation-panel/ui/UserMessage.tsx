import { useEffect, useRef, useState } from 'react'
import { ArrowUp, X } from 'lucide-react'
import { UserMessageActions } from './MessageActions'
import { messageTextClass, userMessageBubbleClass } from './agent-layout'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

const INPUT_MIN_HEIGHT_PX = 42

function resizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = `${INPUT_MIN_HEIGHT_PX}px`
  const next = Math.min(Math.max(el.scrollHeight, INPUT_MIN_HEIGHT_PX), 160)
  el.style.height = `${next}px`
}

interface UserMessageProps {
  messageId: string
  content: string
  disabled?: boolean
  isEditing: boolean
  onEnterEdit: () => void
  onExitEdit: () => void
  onSubmitEdit: (text: string) => void
}

export function UserMessage({
  messageId,
  content,
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
      <div className="group/message space-y-1" data-user-message-edit>
        <div
          className={cn(
            'grid min-h-[42px] w-full grid-cols-[24px_1fr_24px] items-center gap-1',
            userMessageBubbleClass,
            'px-2',
            'transition-colors focus-within:border-muted-foreground/40',
            disabled && 'opacity-60'
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 justify-self-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            title="Cancel"
            aria-label="Cancel edit"
            disabled={disabled}
            onClick={handleCancel}
          >
            <X className="size-3.5" />
          </Button>

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
              'text-sm leading-5 text-foreground placeholder:text-muted-foreground',
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

          <Button
            type="button"
            size="iconSm"
            className={cn(
              'justify-self-center rounded-full transition-colors',
              canSend
                ? 'bg-foreground text-background hover:bg-foreground/90'
                : 'bg-muted text-muted-foreground'
            )}
            disabled={!canSend}
            onClick={handleSubmit}
            title="Send"
            aria-label="Send edited message"
          >
            <ArrowUp className="size-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group/message space-y-1">
      <div className={userMessageBubbleClass}>
        <p className={cn(messageTextClass, 'whitespace-pre-wrap')}>{content}</p>
      </div>
      <UserMessageActions
        content={content}
        disabled={disabled}
        onEdit={onEnterEdit}
      />
    </div>
  )
}
