import { cn } from '@/shared/lib/utils'

export const settingsPageContentClass = 'mx-auto w-full max-w-[760px] pt-2 pb-6'

export const settingsSectionTitleClass = 'mb-3 px-1 text-sm font-semibold text-foreground'
export const settingsSubsectionTitleClass =
  'mb-2 mt-4 px-1 text-xs font-medium text-muted-foreground/90 first:mt-0'

/** Settings cards — dark: #1c1c1c surface, #242424 row dividers. */
export const settingsCardClass = cn(
  'rounded-xl border border-border/80 bg-card shadow-sm',
  'dark:border-transparent dark:bg-[#1c1c1c] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]'
)

export const settingsRowClass = cn(
  'relative flex items-center justify-between gap-3 px-4 py-3',
  'after:absolute after:right-4 after:bottom-0 after:left-4 after:h-px after:bg-border',
  'last:after:hidden',
  'dark:after:bg-[#242424]'
)

export const settingsRowTextWrapClass = 'min-w-0 flex-1'

export const settingsRowTitleClass = 'text-sm font-normal text-foreground'

export const settingsRowDescriptionClass = 'mt-0.5 text-sm text-muted-foreground'

/** Live preview panel in Appearance settings. */
export const settingsPreviewCardClass = cn(
  settingsCardClass,
  'px-4 py-3',
  'dark:bg-[#1c1c1c]'
)
