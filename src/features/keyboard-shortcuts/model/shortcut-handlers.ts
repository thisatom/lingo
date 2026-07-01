import { useEffect } from 'react'
import type { ShortcutId } from '@/shared/lib/keyboard-shortcuts/types'

type ShortcutHandler = () => void | Promise<void>

const handlers = new Map<ShortcutId, ShortcutHandler>()

export function registerShortcutHandler(id: ShortcutId, handler: ShortcutHandler): () => void {
  handlers.set(id, handler)
  return () => {
    if (handlers.get(id) === handler) handlers.delete(id)
  }
}

export function invokeShortcutHandler(id: ShortcutId): void {
  const handler = handlers.get(id)
  if (!handler) return
  void handler()
}

export function useRegisterShortcutHandler(
  id: ShortcutId,
  handler: ShortcutHandler | null,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled || !handler) return
    return registerShortcutHandler(id, handler)
  }, [enabled, handler, id])
}
