import { useCallback, useEffect, useState } from 'react'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import { notifySecretsChanged } from '@/shared/lib/secrets-changed'
import type { SecretStatus } from '@/shared/types/ipc'

export function useOpenRouterKey() {
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
      const next = await getLingo().secrets.getStatus('openrouter')
      setStatus(next)
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to read key status')
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const save = useCallback(async (value: string) => {
    const next = await getLingo().secrets.set('openrouter', value)
    setStatus(next)
    setApiError(null)
    notifySecretsChanged('openrouter')
    return next
  }, [])

  const clear = useCallback(async () => {
    const next = await getLingo().secrets.clear('openrouter')
    setStatus(next)
    notifySecretsChanged('openrouter')
    return next
  }, [])

  const validate = useCallback(async () => {
    return getLingo().secrets.validateOpenRouter()
  }, [])

  return { status, loading, apiError, refresh, save, clear, validate }
}
