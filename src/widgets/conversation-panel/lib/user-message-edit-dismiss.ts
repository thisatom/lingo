type ClosestTarget = { closest(selector: string): Element | null }

function asClosestTarget(target: EventTarget | null): ClosestTarget | null {
  if (!target || typeof target !== 'object') return null
  const candidate = target as unknown as ClosestTarget
  if (typeof candidate.closest !== 'function') return null
  return candidate
}

/** Whether a pointer event outside the edit shell should exit user-message edit mode. */
export function shouldDismissUserMessageEdit(target: EventTarget | null): boolean {
  const el = asClosestTarget(target)
  if (!el) return false
  if (el.closest('[data-user-message-edit]')) return false
  if (el.closest('[data-checkpoint-return-action]')) return false
  if (el.closest('[data-composer-root]')) return false
  if (el.closest('[data-slot="context-menu-content"]')) return false
  return true
}
