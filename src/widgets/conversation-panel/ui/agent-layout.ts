import { cn } from '@/shared/lib/utils'

/** Shared layout for user questions and agent messages in the chat column */
export const messageTextClass = 'text-sm leading-relaxed text-foreground'

export const userMessageBubbleClass =
  'w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-[#2f2f2f] bg-[#212121] px-3 py-2'

export const userMessageTextClass = cn(
  messageTextClass,
  'min-w-0 break-words [overflow-wrap:anywhere] [word-break:break-word]'
)

/** Left inset matches user bubble padding; tighter lists so body copy feels aligned. */
export const agentMessageClass = cn(
  messageTextClass,
  'w-full min-w-0 max-w-full break-words pl-3 pb-0.5 [overflow-wrap:anywhere]'
)
