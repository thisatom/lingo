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
  fadeFromClass = 'from-[#212121]'
}: MessageBodyClampProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return

    const check = () => {
      setOverflowing(el.scrollHeight > el.clientHeight + 1)
    }

    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [children])

  return (
    <div className={cn('relative', className)}>
      <div
        ref={bodyRef}
        className={cn('overflow-hidden', bodyClassName)}
        style={{ maxHeight: MESSAGE_BODY_MAX_HEIGHT_PX }}
      >
        {children}
      </div>
      {overflowing ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t to-transparent',
            fadeFromClass
          )}
          aria-hidden
        />
      ) : null}
    </div>
  )
}
