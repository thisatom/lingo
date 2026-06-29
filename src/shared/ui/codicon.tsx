import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

export type CodiconName = string

export type CodiconProps = Omit<ComponentProps<'span'>, 'children'> & {
  name: CodiconName
}

/** VS Code codicon (icon font). Pixel-snapped sizes: see globals.css `.codicon.size-*`. */
export function Codicon({ name, className, ...props }: CodiconProps) {
  return (
    <span
      className={cn(
        `codicon codicon-${name}`,
        'inline-flex shrink-0 items-center justify-center overflow-hidden text-current leading-none',
        'translate-y-px will-change-transform [-webkit-font-smoothing:antialiased] [text-rendering:geometricPrecision]',
        className
      )}
      aria-hidden
      {...props}
    />
  )
}
