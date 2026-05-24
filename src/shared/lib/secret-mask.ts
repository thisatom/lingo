/** Strip optional `Bearer ` prefix before storing or sending as Authorization. */
export function normalizeBearerApiKey(value: string): string {
  return value.trim().replace(/^Bearer\s+/i, '')
}

/** Display-only preview of a stored secret (never persist this shape). */
export function maskSecretForDisplay(value: string): string {
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

/** True when the string is the UI mask, not a real API key. */
export function isMaskedSecretDisplay(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.includes('•')) return true
  return /^.{6}….{4}$/u.test(trimmed)
}
