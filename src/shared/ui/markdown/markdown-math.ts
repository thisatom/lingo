export function isMathClassName(className?: string): boolean {
  if (!className) return false
  return (
    /\blanguage-math\b/.test(className) ||
    /\bmath-inline\b/.test(className) ||
    /\bmath-display\b/.test(className)
  )
}
