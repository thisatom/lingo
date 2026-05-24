import type { SecretProviderId } from '@/shared/types/ipc'

export const LINGO_SECRETS_CHANGED = 'lingo:secrets-changed'

export function notifySecretsChanged(provider?: SecretProviderId): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(LINGO_SECRETS_CHANGED, { detail: { provider } })
  )
}

export function onSecretsChanged(
  listener: (provider?: SecretProviderId) => void
): () => void {
  if (typeof window === 'undefined') return () => undefined

  const handler = (event: Event) => {
    const provider = (event as CustomEvent<{ provider?: SecretProviderId }>).detail
      ?.provider
    listener(provider)
  }

  window.addEventListener(LINGO_SECRETS_CHANGED, handler)
  return () => window.removeEventListener(LINGO_SECRETS_CHANGED, handler)
}
