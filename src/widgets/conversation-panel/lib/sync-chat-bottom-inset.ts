const CSS_VAR = '--lingo-chat-bottom-inset'
const FALLBACK = '7rem'

/** Sync floating composer stack height to a CSS variable for scroll padding. */
export function bindChatBottomInset(element: HTMLElement | null): () => void {
  const root = document.documentElement

  const apply = () => {
    if (!element) {
      root.style.setProperty(CSS_VAR, FALLBACK)
      return
    }
    const height = Math.ceil(element.getBoundingClientRect().height)
    root.style.setProperty(CSS_VAR, `${height}px`)
  }

  apply()
  if (!element) {
    return () => root.style.removeProperty(CSS_VAR)
  }

  const observer = new ResizeObserver(apply)
  observer.observe(element)
  return () => {
    observer.disconnect()
    root.style.removeProperty(CSS_VAR)
  }
}
