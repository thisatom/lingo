import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

export type CodiconName = string

export type CodiconProps = Omit<ComponentProps<'span'>, 'children'> & {
  name: CodiconName
}

/** VS Code codicon (icon font). Use `className="size-4"` etc. for sizing. */
export function Codicon({ name, className, ...props }: CodiconProps) {
  return (
    <span
      className={cn(
        `codicon codicon-${name}`,
        'inline-flex shrink-0 items-center justify-center text-current leading-none',
        className
      )}
      aria-hidden
      {...props}
    />
  )
}
