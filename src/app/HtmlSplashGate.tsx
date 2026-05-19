import { useLayoutEffect } from 'react'
import { hideAppSplash } from '@/shared/lib/hooks/use-app-ready'

/** Remove static HTML splash so React overlay (shadcn skeleton/spinner) is visible. */
export function HtmlSplashGate() {
  useLayoutEffect(() => {
    hideAppSplash()
  }, [])
  return null
}
