import { modalSurfaceClass } from '@/shared/lib/design-surface'
import { cn } from '@/shared/lib/utils'

export const confirmActionDialogContentClass = cn(
  modalSurfaceClass,
  'gap-0 overflow-hidden p-0',
  'data-[size=default]:sm:max-w-[440px] data-[size=sm]:max-w-[400px]'
)

export const confirmActionDialogTitleClass = cn(
  'text-[15px] font-semibold leading-snug text-foreground'
)

export const confirmActionDialogDescriptionClass = cn(
  'text-[13px] leading-[1.45] text-muted-foreground'
)

export const confirmActionDialogSeparatorClass = cn(
  'h-px w-full shrink-0 bg-separator'
)

export const confirmActionDialogFooterCheckboxClass = cn(
  '!size-3.5 shrink-0 rounded-[3px] border border-solid border-input bg-background shadow-none outline-none',
  'focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-0',
  'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
  '[&_[data-slot=checkbox-indicator]_svg]:!size-2.5'
)

export const confirmActionDialogFooterLabelClass = cn(
  'cursor-pointer select-none text-[13px] leading-none text-muted-foreground'
)

/** Shared circular close control — dialogs, toasts, compact surfaces. */
export const surfaceCloseButtonClass = cn(
  'flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full',
  'text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50'
)

/** Close in a title row — optically aligns with the first line of text. */
export const surfaceCloseButtonTitleRowClass = cn(surfaceCloseButtonClass, 'mt-0.5')

export const confirmActionDialogCloseClass = surfaceCloseButtonTitleRowClass

/** Title row with trailing close — matches confirm / rename / toast headers. */
export const surfaceTitleRowClass = 'flex items-start gap-2'

export const confirmActionDialogHeaderClass = cn(
  surfaceTitleRowClass,
  'px-4 pt-2.5 pb-2'
)

export const confirmActionDialogCancelClass = cn(
  'inline-flex !h-[21px] min-h-[21px] min-w-0 items-center justify-center border-0 bg-transparent px-2.5 py-0 text-[13px] font-normal leading-none text-muted-foreground',
  'shadow-none hover:bg-transparent hover:text-foreground',
  'focus-visible:ring-1 focus-visible:ring-ring/50'
)

export function confirmActionDialogPrimaryClass(variant: 'accent' | 'destructive' = 'accent') {
  return cn(
    'inline-flex !h-[21px] min-h-[21px] min-w-[4.5rem] items-center justify-center rounded-md border border-solid px-3 py-0 text-[13px] font-medium leading-none shadow-none',
    'hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-0',
    variant === 'destructive'
      ? 'border-destructive/70 bg-destructive text-destructive-foreground focus-visible:ring-destructive/50'
      : 'border-primary/70 bg-primary text-primary-foreground focus-visible:ring-primary/50'
  )
}
