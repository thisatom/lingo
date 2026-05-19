import { cn } from '@/shared/lib/utils'

/** Shared layout for user questions and agent messages in the chat column */
export const messageTextClass = 'text-[13px] leading-[1.5] text-foreground'

export const userMessageBubbleClass =
  'relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#2f2f2f] bg-[#212121] px-3 py-2.5'

export const userMessageTextClass = cn(
  messageTextClass,
  'min-w-0 break-words [overflow-wrap:anywhere] [word-break:break-word]'
)

export const userMessageEditButtonClass = cn(
  'absolute right-1 top-1/2 z-10 size-7 -translate-y-1/2 shrink-0 rounded-full',
  'text-muted-foreground/55 hover:bg-[#2a2a2a] hover:text-muted-foreground'
)

export const agentMessageWrapClass = 'w-full min-w-0 max-w-full'

/** Left inset matches user bubble padding; tighter lists so body copy feels aligned. */
export const agentMessageClass = cn(
  messageTextClass,
  'w-full min-w-0 max-w-full break-words px-0.5 pb-0.5 [overflow-wrap:anywhere] [word-break:break-word]'
)
