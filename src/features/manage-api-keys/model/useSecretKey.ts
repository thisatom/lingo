import { useCallback, useEffect, useState } from 'react'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import type { SecretProviderId, SecretStatus } from '@/shared/types/ipc'

export function useSecretKey(provider: SecretProviderId) {
  const [status, setStatus] = useState<SecretStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setApiError(null)
    try {
      if (!isLingoAvailable()) {
        setApiError('Desktop API unavailable. Run: npm run dev')
        setStatus(null)
        return
      }
      const next = await getLingo().secrets.getStatus(provider)
      setStatus(next)
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to read key status')
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [provider])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const save = useCallback(
    async (value: string) => {
      const next = await getLingo().secrets.set(provider, value)
      setStatus(next)
      setApiError(null)
      return next
    },
    [provider]
  )

  const clear = useCallback(async () => {
    const next = await getLingo().secrets.clear(provider)
    setStatus(next)
    return next
  }, [provider])

  return { status, loading, apiError, refresh, save, clear }
}

