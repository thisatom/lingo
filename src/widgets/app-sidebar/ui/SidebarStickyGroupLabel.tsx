import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SIDEBAR_INSET_CLASS } from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'
import { SidebarGroupLabel } from '@/shared/ui/sidebar'
import { sidebarGroupLabelClass } from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
import { sidebarGroupLabelStuckClass } from '@/shared/lib/sidebar-scroll-chrome'

interface SidebarStickyGroupLabelProps {
  children: ReactNode
  className?: string
}

/** Full-width sticky section label — stuck state drives the active shadow. */
export function SidebarStickyGroupLabel({
  children,
  className
}: SidebarStickyGroupLabelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const root = sentinel.closest('[data-scroll-viewport]')
    if (!(root instanceof HTMLElement)) return

    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { root, threshold: 0, rootMargin: '1px 0px 0px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full shrink-0" aria-hidden />
      <SidebarGroupLabel
        data-stuck={stuck ? 'true' : undefined}
        className={cn(
          sidebarGroupLabelClass,
          stuck && sidebarGroupLabelStuckClass,
          className
        )}
      >
        <span className={cn(SIDEBAR_INSET_CLASS, 'block w-full')}>{children}</span>
      </SidebarGroupLabel>
    </>
  )
}
