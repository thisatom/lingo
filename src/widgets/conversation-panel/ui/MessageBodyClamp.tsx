import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export const MESSAGE_BODY_MAX_HEIGHT_PX = 90

interface MessageBodyClampProps {
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** Tailwind `from-*` color for the bottom fade when content overflows */
  fadeFromClass?: string
}

/** Clamps user question text; not used for agent replies. */
export function MessageBodyClamp({
  children,
  className,
  bodyClassName,
  fadeFromClass = 'from-chat-assistant'
}: MessageBodyClampProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setExpanded(false)
  }, [children])

  useEffect(() => {
    const el = bodyRef.current
    if (!el || expanded) {
      setOverflowing(false)
      return
    }

    const check = () => {
      setOverflowing(el.scrollHeight > el.clientHeight + 1)
    }

    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [children, expanded])

  return (
    <div className={cn('relative', className)}>
      <div
        ref={bodyRef}
        className={cn('h-auto overflow-hidden', bodyClassName)}
        style={expanded ? undefined : { maxHeight: MESSAGE_BODY_MAX_HEIGHT_PX }}
      >
        {children}
      </div>
      {overflowing && !expanded ? (
        <>
          <div
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t to-transparent',
              fadeFromClass
            )}
            aria-hidden
          />
          <button
            type="button"
            className="absolute inset-x-0 bottom-0 cursor-pointer bg-gradient-to-t from-chat-assistant via-chat-assistant/90 to-transparent pt-6 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation()
              setExpanded(true)
            }}
          >
            Show more
          </button>
        </>
      ) : null}
    </div>
  )
}
