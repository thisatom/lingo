import type { LocalWebSearchResult } from '@/shared/lib/local-web-search'
import type { LocalWebSearchProgress } from '@/shared/lib/local-web-search-progress'

export type LocalWebSearchFn = (
  query: string,
  progress?: LocalWebSearchProgress
) => Promise<LocalWebSearchResult[]>

let localWebSearchFn: LocalWebSearchFn | null = null

export function registerLocalWebSearch(fn: LocalWebSearchFn): void {
  localWebSearchFn = fn
}

export function isLocalWebSearchRegistered(): boolean {
  return localWebSearchFn != null
}

export async function searchWebLocal(
  query: string,
  progress?: LocalWebSearchProgress
): Promise<LocalWebSearchResult[]> {
  if (!localWebSearchFn) return []
  const trimmed = query.trim()
  if (!trimmed) return []
  return localWebSearchFn(trimmed, progress)
}
