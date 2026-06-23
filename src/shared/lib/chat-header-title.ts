/** Title shown in the main chat header (sidebar keeps the same string). */
export function getChatHeaderDisplayTitle(title?: string | null): string {
  const trimmed = title?.trim()
  if (!trimmed) return 'New chat'
  return trimmed
}
