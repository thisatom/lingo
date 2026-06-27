import { cn } from '@/shared/lib/utils'

/** Single 1px edge — no ring+border stacking. */
export const overlayBorderClass = 'border border-overlay-border'

export const panelShadowSmClass = 'shadow-sm shadow-black/5 dark:shadow-black/25'
export const panelShadowMdClass = 'shadow-md shadow-black/10 dark:shadow-black/35'
export const panelShadowLgClass = 'shadow-lg shadow-black/15 dark:shadow-black/45'

/** Popover, dropdown, tooltip, hover card. */
export const elevatedSurfaceClass = cn(
  'rounded-lg bg-popover text-popover-foreground',
  overlayBorderClass,
  panelShadowMdClass
)

/** Settings cards, composer stack panels. */
export const elevatedCardClass = cn(
  'rounded-xl border border-border bg-card text-card-foreground',
  panelShadowSmClass
)

/** Dialog / alert content shell. */
export const modalSurfaceClass = cn(
  'rounded-xl bg-popover text-sm text-popover-foreground',
  overlayBorderClass,
  panelShadowLgClass
)

/** Modal backdrop — tint only, no blur. */
export const dialogOverlayClass = 'bg-black/45'

/** @deprecated alias — menu panels use overlay border, not ring. */
export const menuSurfaceRingClass = overlayBorderClass

export const menuHoverClass = 'hover:bg-accent hover:text-accent-foreground'

/** Icon hit targets (sidebar chrome, composer toolbar). */
export const iconButtonHoverClass = cn(
  'rounded-lg transition-colors duration-100',
  'hover:bg-accent hover:text-accent-foreground',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35'
)

/** Compact chips (sources, filters). */
export const chipSurfaceClass = cn(
  'inline-flex items-center',
  'rounded-full border border-overlay-border bg-secondary/80 text-muted-foreground',
  'transition-colors duration-100 hover:bg-accent hover:text-accent-foreground'
)

/** Tooltip shell — bordered popover, no arrow. */
export const tooltipSurfaceClass = cn(
  'rounded-md bg-popover text-popover-foreground',
  overlayBorderClass,
  panelShadowMdClass
)

/** Rows inside elevated panels (sources list). */
export const panelRowHoverClass = cn(
  'rounded-lg border border-transparent transition-colors duration-100',
  'hover:border-overlay-border hover:bg-accent/80 hover:text-foreground'
)

/** Sidebar / menu list rows. */
export const listRowHoverClass = cn(
  'rounded-lg transition-colors duration-100',
  'hover:bg-accent hover:text-accent-foreground'
)
