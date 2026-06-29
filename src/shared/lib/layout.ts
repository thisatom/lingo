/** Max width for chat column: user questions, agent replies, composer. */
export const CHAT_COLUMN_MAX_WIDTH_CLASS = 'max-w-full sm:max-w-[640px] lg:max-w-[750px]'

/** Horizontal padding for settings toolbar and non-chat pages. */
export const PAGE_HORIZONTAL_PADDING_CLASS = 'px-3 sm:px-4 md:px-6'

/** Tighter horizontal padding for agent chat column and composer. */
export const CHAT_HORIZONTAL_PADDING_CLASS = 'px-2 sm:px-3 md:px-4'

/** Width of settings sidebar chrome (hide + search). */
export const SETTINGS_CHROME_ACTIONS_WIDTH_PX = 62

/** Width of the three fixed chat chrome icon buttons (30px × 3 + gaps). */
export const CHAT_CHROME_ACTIONS_WIDTH_PX = 94

/** Left inset for fixed sidebar chrome — matches {@link SIDEBAR_INSET_CLASS}. */
export const CHAT_CHROME_LEFT_PX = 8

/** Viewport X where chat title starts when the sidebar is hidden. */
export const CHAT_TITLE_COLLAPSED_START_PX =
  CHAT_CHROME_LEFT_PX + CHAT_CHROME_ACTIONS_WIDTH_PX

/**
 * margin-left when sidebar is hidden — compensates responsive header padding.
 */
export const CHAT_TITLE_COLLAPSED_MARGIN_CLASS =
  'ml-[94px] sm:ml-[90px] md:ml-[86px]'

/** Shared 30px top chrome row (sidebar header + chat header). */
export const CHAT_CHROME_ROW_HEIGHT_CLASS = 'h-[30px] min-h-[30px]'

/** Fixed shell position for primary chat chrome — matches sidebar header inset. */
export const CHAT_CHROME_FIXED_POSITION_CLASS = 'absolute left-2 top-2 z-40'

/** Reserve space for the header “…” menu on the right. */
export const CHAT_HEADER_MENU_RESERVE_PX = 32

/** 8px corner radius for sidebar rows and settings nav. */
export const APP_RADIUS_8_CLASS = 'rounded-lg'

/** Settings page horizontal inset on narrow viewports. */
export const SETTINGS_PAGE_INSET_CLASS = 'px-1 sm:px-0'

/** Uniform horizontal inset for sidebar chrome and lists. */
export const SIDEBAR_INSET_CLASS = 'px-2'

/** Default expanded sidebar width (pixels). */
export const SIDEBAR_PANEL_DEFAULT_WIDTH_PX = 280

/** Maximum sidebar width when dragging (pixels). */
export const SIDEBAR_PANEL_MAX_WIDTH_PX = 360

/**
 * Minimum expanded sidebar width — fits top chrome + footer row without clipping.
 * Collapse only via the hide button, not by dragging below this size.
 */
export const SIDEBAR_PANEL_MIN_SIZE_PX = 240

/** Panel widths at or below this are treated as hidden (hide button). */
export const SIDEBAR_PANEL_HIDDEN_THRESHOLD_PX = 8
