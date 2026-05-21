import { cn } from '@/shared/lib/utils'

/** Text selection allowed inside chat Q&A (app shell uses select-none). */
export const chatSelectableClass = 'select-text'

/** Shared layout for user questions and agent messages in the chat column */
export const messageTextClass = 'text-[13px] leading-[1.5] text-foreground'

export const userMessageBubbleClass =
  'relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-chat-assistant px-3 py-1.5'

export const userMessageTextClass = cn(
  messageTextClass,
  'min-w-0 break-words [overflow-wrap:anywhere] [word-break:break-word]'
)

export const userMessageEditButtonClass = cn(
  'absolute right-1 top-1/2 z-10 size-6 -translate-y-1/2 shrink-0 rounded-full',
  'text-muted-foreground/55 hover:bg-accent hover:text-muted-foreground'
)

/** Slight indent so agent replies sit right of the user bubble column. */
export const agentContentIndentClass = 'pl-3 sm:pl-4'

export const agentMessageWrapClass = 'w-full min-w-0 max-w-full'

export const agentMessageBubbleClass = cn(
  'relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-chat-assistant px-3 py-2'
)

export const agentMessageClass = cn(
  messageTextClass,
  'w-full min-w-0 max-w-full break-words px-0.5 pb-0.5 [overflow-wrap:anywhere] [word-break:break-word]'
)

export const messageActionButtonClass = cn(
  'text-muted-foreground/55 hover:bg-accent hover:text-muted-foreground'
)
