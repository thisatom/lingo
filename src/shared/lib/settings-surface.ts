import { elevatedCardClass } from '@/shared/lib/design-surface'
import { cn } from '@/shared/lib/utils'

export const settingsPageContentClass = cn(
  'mx-auto w-full min-w-0 max-w-[760px] pt-2 pb-6'
)

export const settingsSectionTitleClass = 'mb-3 px-1 text-sm font-semibold text-foreground'
export const settingsSubsectionTitleClass =
  'mb-2 mt-4 px-1 text-xs font-medium text-muted-foreground/90 first:mt-0'

/** Settings cards — TrustRouter ring elevation. */
export const settingsCardClass = elevatedCardClass

export const settingsRowClass = cn(
  'relative flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4',
  'after:absolute after:right-3 after:bottom-0 after:left-3 after:h-px after:bg-separator sm:after:right-4 sm:after:left-4',
  'last:after:hidden'
)

export const settingsRowTextWrapClass = 'min-w-0 flex-1'

/** Trailing control in a settings row (select, switch, action button). */
export const settingsRowControlClass =
  'flex w-full shrink-0 items-center justify-end sm:w-auto sm:justify-end'

/** Destructive row actions — compact bordered pill. */
export const settingsDestructiveButtonClass = cn(
  'inline-flex h-6 min-h-6 shrink-0 items-center justify-center self-end px-2.5 text-xs leading-none',
  'border border-destructive/40 hover:border-destructive/55 sm:self-auto'
)

export const settingsRowTitleClass = 'text-sm font-normal text-foreground'

export const settingsRowDescriptionClass = 'mt-0.5 text-sm text-muted-foreground'

/** Live preview panel in Appearance settings. */
export const settingsPreviewCardClass = cn(settingsCardClass, 'px-4 py-3')
