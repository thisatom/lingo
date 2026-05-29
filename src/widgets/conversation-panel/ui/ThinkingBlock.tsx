import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/shared/ui/collapsible'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'
import { MarkdownContent } from '@/shared/ui/markdown-content'
import { ShinyText } from '@/shared/ui/shiny-text'
import { ChevronRightIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/utils'
import {
  agentMessageClass,
  chatSelectableClass,
  THINKING_SCROLL_MAX_HEIGHT,
  thinkingReasoningClass,
  thinkingTriggerClass
} from './agent-layout'
import { formatThoughtDuration } from '@/widgets/conversation-panel/lib/thought-duration'

type ThinkingBlockProps = {
  content: string
  live?: boolean
  thoughtDurationMs?: number
  className?: string
}

function ThinkingReasoningScroll({
  content,
  children,
  pinToBottom = false,
  className
}: {
  content: string
  children: ReactNode
  pinToBottom?: boolean
  className?: string
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!pinToBottom) return
    const el = viewportRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [content, pinToBottom])

  return (
    <div
      className={cn('thinking-scroll-panel min-h-0 overflow-hidden', className)}
      style={{ maxHeight: THINKING_SCROLL_MAX_HEIGHT }}
    >
      <CustomScrollArea
        variant="thinking"
        className="min-h-0 max-h-[7.5rem]"
        onViewportRef={(el) => {
          viewportRef.current = el
        }}
      >
        <div className="py-2">{children}</div>
      </CustomScrollArea>
    </div>
  )
}

function ThinkingReasoningBody({ content, pinToBottom }: { content: string; pinToBottom?: boolean }) {
  return (
    <ThinkingReasoningScroll content={content} pinToBottom={pinToBottom}>
      <MarkdownContent
        content={content}
        variant="typography"
        parseThrottleMs={pinToBottom ? 120 : undefined}
        className={cn(thinkingReasoningClass, chatSelectableClass)}
      />
    </ThinkingReasoningScroll>
  )
}

function ThinkingTriggerLabel({ live, summary }: { live: boolean; summary: string }) {
  if (live) {
    return (
      <ShinyText
        text="Thinking"
        className={cn('min-w-0 truncate', thinkingTriggerClass)}
        color="var(--thinking-foreground)"
        shineColor="var(--foreground)"
        speed={2.2}
        spread={110}
      />
    )
  }
  return <span className="min-w-0 truncate">{summary}</span>
}

export function ThinkingBlock({
  content,
  live = false,
  thoughtDurationMs,
  className
}: ThinkingBlockProps) {
  const [open, setOpen] = useState(live)
  const hasContent = Boolean(content.trim())

  useEffect(() => {
    if (live) setOpen(true)
  }, [live])

  if (!live && !hasContent) return null

  const summary =
    thoughtDurationMs != null ? formatThoughtDuration(thoughtDurationMs) : 'Thought'

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn('group min-w-0', agentMessageClass, className)}
    >
      <CollapsibleTrigger
        type="button"
        className={cn(
          'flex w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-sm py-0.5 text-left',
          !live && thinkingTriggerClass,
          'hover:text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
        )}
      >
        <ChevronRightIcon
          className="size-3.5 shrink-0 text-[color:var(--thinking-foreground)] transition-transform duration-200 group-data-[state=open]:rotate-90"
          aria-hidden
        />
        <ThinkingTriggerLabel live={live} summary={summary} />
      </CollapsibleTrigger>
      {hasContent ? (
        <CollapsibleContent className="pt-1.5">
          <ThinkingReasoningBody content={content} pinToBottom={live} />
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  )
}
