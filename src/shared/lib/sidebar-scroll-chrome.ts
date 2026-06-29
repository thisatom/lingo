/** Sidebar list scroll — symmetric edge scrims (scroll-driven in CustomScrollArea). */
export const SIDEBAR_SCROLL_FADE_HEIGHT_PX = 72

export const sidebarScrollFadeTopClass =
  'pointer-events-none absolute inset-x-0 top-0 z-[1] bg-gradient-to-b from-sidebar from-20% via-sidebar/75 via-50% to-transparent transition-opacity duration-200 ease-out'

export const sidebarScrollFadeBottomClass =
  'pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-sidebar from-20% via-sidebar/75 via-50% to-transparent transition-opacity duration-200 ease-out'

/** Sticky date / section label — depth when pinned under the scroll viewport top. */
export const sidebarGroupLabelStuckClass =
  'shadow-[0_10px_24px_-16px_rgba(0,0,0,0.18)] dark:shadow-[0_10px_24px_-16px_rgba(0,0,0,0.42)]'
