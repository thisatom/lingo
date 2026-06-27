import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { Button, type ButtonProps } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TOOLTIP_SHOW_DELAY_MS
} from '@/shared/ui/tooltip'

type TooltipWrapProps = {
  label: ReactNode
  children: ReactElement
  side?: ComponentProps<typeof TooltipContent>['side']
  align?: ComponentProps<typeof TooltipContent>['align']
  sideOffset?: number
  contentClassName?: string
  delayDuration?: number
}

export function TooltipWrap({
  label,
  children,
  side = 'top',
  align,
  sideOffset,
  contentClassName,
  delayDuration = TOOLTIP_SHOW_DELAY_MS
}: TooltipWrapProps) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={contentClassName}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

type TooltipIconButtonProps = ButtonProps & {
  tooltip: ReactNode
  children: ReactNode
  triggerClassName?: string
  tooltipSide?: ComponentProps<typeof TooltipContent>['side']
  tooltipAlign?: ComponentProps<typeof TooltipContent>['align']
  tooltipSideOffset?: number
  tooltipClassName?: string
  tooltipDelay?: number
}

export function TooltipIconButton({
  tooltip,
  disabled,
  className,
  triggerClassName,
  tooltipSide,
  tooltipAlign,
  tooltipSideOffset,
  tooltipClassName,
  tooltipDelay = 0,
  children,
  type = 'button',
  'aria-label': ariaLabelProp,
  ...props
}: TooltipIconButtonProps) {
  const ariaFallback =
    typeof tooltip === 'string' || typeof tooltip === 'number' ? String(tooltip) : undefined

  const button = (
    <Button
      type={type}
      disabled={disabled}
      className={cn(className, !disabled && triggerClassName, disabled && 'pointer-events-none')}
      {...props}
      aria-label={ariaLabelProp ?? ariaFallback}
    >
      {children}
    </Button>
  )

  return (
    <Tooltip delayDuration={tooltipDelay}>
      <TooltipTrigger asChild>
        {disabled ? (
          <span className={cn('inline-flex', triggerClassName)} tabIndex={-1} aria-disabled="true">
            {button}
          </span>
        ) : (
          button
        )}
      </TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipSideOffset}
        className={tooltipClassName}
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
