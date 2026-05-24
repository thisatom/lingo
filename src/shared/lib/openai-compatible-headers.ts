import { normalizeBearerApiKey } from '@/shared/lib/secret-mask'

export function openaiCompatibleHeaders(apiKey: string): Record<string, string> {
  const token = normalizeBearerApiKey(apiKey)
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}
