import { hostFromUrl } from '@/shared/lib/web-search-targets'

/** Favicon URL for a page host (used in source lists). */
export function siteFaviconUrl(pageUrl: string, size = 32): string {
  const host = hostFromUrl(pageUrl)
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`
}
