/**
 * Auto-collapse only when the user shrinks the panel below the threshold.
 * Expanding from collapsed fires intermediate sizes below threshold — must not re-collapse.
 */
export function shouldCollapseSidebarOnResize(
  panelSizePercent: number,
  previousSizePercent: number | null,
  thresholdPercent: number
): boolean {
  if (previousSizePercent == null) return false
  if (panelSizePercent >= thresholdPercent) return false
  return panelSizePercent < previousSizePercent - 0.01
}
