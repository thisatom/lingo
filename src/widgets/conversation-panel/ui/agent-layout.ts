import { cn } from '@/shared/lib/utils'

/** Shared layout for user questions and agent messages in the chat column */
export const messageTextClass = 'text-sm leading-relaxed text-foreground'

export const userMessageBubbleClass =
  'rounded-xl border border-[#2f2f2f] bg-[#212121] px-3 py-2.5'

/** Left inset matches user bubble padding; tighter lists so body copy feels aligned. */
export const agentMessageClass = cn(messageTextClass, 'pl-3 pb-0.5')
