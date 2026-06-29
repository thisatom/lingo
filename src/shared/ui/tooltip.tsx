import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { tooltipSurfaceClass } from '@/shared/lib/design-surface'
import { dismissAllTooltips, registerTooltipDismissHandler } from '@/shared/ui/tooltip-dismiss'
import { cn } from '@/shared/lib/utils'

export const TOOLTIP_SHOW_DELAY_MS = 320
export const TOOLTIP_SKIP_DELAY_MS = 160

export const tooltipContentClass = cn(
  'lingo-tooltip-content z-[70] max-w-[min(18rem,calc(100vw-1.25rem))] origin-(--radix-tooltip-content-transform-origin)',
  'px-2.5 py-1.5 text-xs leading-snug font-medium text-balance text-popover-foreground',
  tooltipSurfaceClass
)

function TooltipProvider({
  delayDuration = TOOLTIP_SHOW_DELAY_MS,
  skipDelayDuration = TOOLTIP_SKIP_DELAY_MS,
  disableHoverableContent = true,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  React.useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('[data-slot="tooltip-trigger"]')) return
      if (target.closest('[data-slot="tooltip-content"]')) return
      dismissAllTooltips()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissAllTooltips()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') dismissAllTooltips()
    }

    let leaveTimer: ReturnType<typeof setTimeout> | undefined
    const onPointerMove = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('[data-slot="tooltip-trigger"]')) {
        if (leaveTimer) clearTimeout(leaveTimer)
        return
      }
      if (target.closest('[data-slot="tooltip-content"]')) {
        if (leaveTimer) clearTimeout(leaveTimer)
        return
      }
      if (leaveTimer) clearTimeout(leaveTimer)
      leaveTimer = setTimeout(() => dismissAllTooltips(), 100)
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('pointermove', onPointerMove)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('pointermove', onPointerMove)
      if (leaveTimer) clearTimeout(leaveTimer)
    }
  }, [])

  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      disableHoverableContent={disableHoverableContent}
      {...props}
    >
      {children}
    </TooltipPrimitive.Provider>
  )
}

function Tooltip({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  React.useEffect(() => {
    if (!open) return
    return registerTooltipDismissHandler(() => setOpen(false))
  }, [open, setOpen])

  React.useEffect(() => {
    return () => setOpen(false)
  }, [setOpen])

  return (
    <TooltipPrimitive.Root
      data-slot="tooltip"
      delayDuration={delayDuration}
      open={open}
      onOpenChange={setOpen}
      {...props}
    />
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 6,
  collisionPadding = 12,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(tooltipContentClass, className)}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
