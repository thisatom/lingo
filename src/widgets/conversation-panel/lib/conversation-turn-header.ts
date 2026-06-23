export const STICKY_HEADER_BASE_Z_INDEX = 20
/** Stay below chat scrollbar (`CustomScrollArea` chat variant uses z-40). */
export const STICKY_HEADER_MAX_Z_INDEX = 39

export function resolveUserHeaderStickyClass(isEditing: boolean, userHeaderSticky: boolean): string {
  return isEditing || !userHeaderSticky ? 'relative' : 'sticky top-0 pb-px'
}

export function resolveUserHeaderStickyZIndex(
  isEditing: boolean,
  userHeaderSticky: boolean,
  turnIndex: number
): number | undefined {
  if (isEditing || !userHeaderSticky) return undefined
  return Math.min(STICKY_HEADER_BASE_Z_INDEX + turnIndex, STICKY_HEADER_MAX_Z_INDEX)
}
