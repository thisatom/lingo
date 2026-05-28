import { composerInputHoverClass } from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'

/** Composer toolbar ghost icons — pair with `Button` size `iconSm` (28px). */
export const composerToolbarIconClass = cn(
  'shrink-0 text-muted-foreground',
  composerInputHoverClass
)

export const CHAT_MODE_LABELS = {
  text: 'Agent',
  conversation: 'Agent Speech'
} as const
