import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { useOpenRouterKey } from '@/features/manage-api-keys/model/useOpenRouterKey'
import { isValidCustomApiBaseUrl } from '@/shared/config/custom-llm'
import { customEndpointRequiresApiKey } from '@/shared/lib/custom-llm-errors'
import { parseCustomLlmProfileSource } from '@/shared/lib/custom-llm-profile'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import { onSecretsChanged } from '@/shared/lib/secrets-changed'
import type { SecretProviderId, SecretStatus } from '@/shared/types/ipc'

export type LlmChatReadyState = {
  ready: boolean
  loading: boolean
  /** Short hint for composer placeholder when not ready. */
  blockedReason: string | null
}

function resolveCustomBaseUrl(
  customLlmProfileJson: string,
  customApiBaseUrl: string
): string {
  const parsed = parseCustomLlmProfileSource(customLlmProfileJson)
  if (parsed.ok) return parsed.data.baseUrl.trim()
  return customApiBaseUrl.trim()
}

export function resolveOpenRouterReadyState(
  status: Pick<SecretStatus, 'isSet'> | null,
  loading: boolean
): Pick<LlmChatReadyState, 'ready' | 'loading' | 'blockedReason'> {
  const isSet = Boolean(status?.isSet)
  return {
    ready: isSet,
    loading: loading && !isSet,
    blockedReason: isSet ? null : 'Add API key in Settings…'
  }
}

export function useLlmChatReady(): LlmChatReadyState {
  const llmBackend = useSettingsStore((s) => s.llmBackend)
  const customLlmProfileJson = useSettingsStore((s) => s.customLlmProfileJson)
  const customApiBaseUrl = useSettingsStore((s) => s.customApiBaseUrl)
  const { status: openRouterStatus, loading: openRouterLoading, refresh: refreshOpenRouter } =
    useOpenRouterKey()
  const [customKeyStatus, setCustomKeyStatus] = useState<SecretStatus | null>(null)
  const [customKeyLoading, setCustomKeyLoading] = useState(false)

  const refreshCustomKey = useCallback(async () => {
    if (llmBackend !== 'custom' || !isLingoAvailable()) {
      setCustomKeyStatus(null)
      setCustomKeyLoading(false)
      return
    }
    setCustomKeyLoading(true)
    try {
      const next = await getLingo().secrets.getStatus('custom-llm')
      setCustomKeyStatus(next)
    } catch {
      setCustomKeyStatus(null)
    } finally {
      setCustomKeyLoading(false)
    }
  }, [llmBackend])

  useEffect(() => {
    void refreshCustomKey()
  }, [refreshCustomKey, customLlmProfileJson, customApiBaseUrl])

  useEffect(() => {
    const refreshForProvider = (provider?: SecretProviderId) => {
      if (!provider || provider === 'custom-llm') void refreshCustomKey()
      if (!provider || provider === 'openrouter') void refreshOpenRouter()
    }

    const unsubscribe = onSecretsChanged(refreshForProvider)
    const onFocus = () => refreshForProvider()
    window.addEventListener('focus', onFocus)

    return () => {
      unsubscribe()
      window.removeEventListener('focus', onFocus)
    }
  }, [refreshCustomKey, refreshOpenRouter])

  return useMemo((): LlmChatReadyState => {
    if (llmBackend === 'openrouter') {
      return resolveOpenRouterReadyState(openRouterStatus, openRouterLoading)
    }

    if (llmBackend === 'custom') {
      if (!isLingoAvailable()) {
        return {
          ready: false,
          loading: false,
          blockedReason: 'Custom server requires the desktop app (npm run dev).'
        }
      }

      const baseUrl = resolveCustomBaseUrl(customLlmProfileJson, customApiBaseUrl)
      const parsedProfile = parseCustomLlmProfileSource(customLlmProfileJson)
      if (customLlmProfileJson.trim() && !parsedProfile.ok) {
        return {
          ready: false,
          loading: false,
          blockedReason: `Fix custom endpoint profile: ${parsedProfile.error}`
        }
      }
      if (!baseUrl || !isValidCustomApiBaseUrl(baseUrl)) {
        return {
          ready: false,
          loading: customKeyLoading,
          blockedReason: 'Configure custom endpoint in Settings → API…'
        }
      }

      if (customEndpointRequiresApiKey(baseUrl)) {
        const isSet = Boolean(customKeyStatus?.isSet)
        return {
          ready: isSet,
          loading: customKeyLoading && !isSet,
          blockedReason: isSet ? null : 'Add custom endpoint API key in Settings…'
        }
      }

      return { ready: true, loading: false, blockedReason: null }
    }

    return { ready: false, loading: false, blockedReason: 'Configure API in Settings…' }
  }, [
    customApiBaseUrl,
    customKeyLoading,
    customKeyStatus?.isSet,
    customLlmProfileJson,
    llmBackend,
    openRouterLoading,
    openRouterStatus?.isSet
  ])
}
