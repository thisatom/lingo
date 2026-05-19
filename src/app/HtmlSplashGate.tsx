import { useLayoutEffect } from 'react'
import { hideAppSplash } from '@/shared/lib/hooks/use-app-ready'

/** Remove static HTML splash so the React startup shell (skeleton + spinner) is shown once. */
export function HtmlSplashGate() {
  useLayoutEffect(() => {
    hideAppSplash()
  }, [])
  return null
}
