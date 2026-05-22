import { cn } from '@/shared/lib/utils'

/** Text selection allowed inside chat Q&A (app shell uses select-none). */
export const chatSelectableClass = 'select-text'

/** Shared layout for user questions and agent messages in the chat column */
export const messageTextClass = 'text-[13px] leading-[1.5] text-foreground'

const chatMessageBubbleBorderClass =
  'border border-chat-message-border transition-[border-color] hover:border-chat-message-border-hover'

export const userMessageBubbleClass = cn(
  'relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl bg-chat-assistant px-3 py-1.5',
  chatMessageBubbleBorderClass
)

export const userMessageTextClass = cn(
  messageTextClass,
  'min-w-0 break-words [overflow-wrap:anywhere] [word-break:break-word]'
)

export const userMessageEditButtonClass = cn(
  'absolute right-1 top-1/2 z-10 size-6 -translate-y-1/2 shrink-0 rounded-full',
  'text-muted-foreground/55 hover:bg-accent hover:text-muted-foreground'
)

export const agentMessageWrapClass = 'w-full min-w-0 max-w-full'

export const agentMessageBubbleClass = cn(
  'relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl bg-chat-assistant px-3 py-2',
  chatMessageBubbleBorderClass
)

/** Horizontal padding matches `userMessageBubbleClass` (px-3) so Q&A text shares one column. */
export const agentMessageClass = cn(
  messageTextClass,
  'w-full min-w-0 max-w-full break-words px-3 pb-0.5 [overflow-wrap:anywhere] [word-break:break-word]'
)

export const messageActionButtonClass = cn(
  'text-muted-foreground/55 hover:bg-accent hover:text-muted-foreground'
)
