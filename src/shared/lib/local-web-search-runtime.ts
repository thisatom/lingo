import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'

export type LocalWebSearchFn = (query: string) => Promise<LocalWebSearchResult[]>

let localWebSearchFn: LocalWebSearchFn | null = null

export function registerLocalWebSearch(fn: LocalWebSearchFn): void {
  localWebSearchFn = fn
}

export function isLocalWebSearchRegistered(): boolean {
  return localWebSearchFn != null
}

export async function searchWebLocal(query: string): Promise<LocalWebSearchResult[]> {
  if (!localWebSearchFn) return []
  const trimmed = query.trim()
  if (!trimmed) return []
  return localWebSearchFn(trimmed)
}
