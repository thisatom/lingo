import { normalizeCustomApiRootUrl } from '@/shared/config/custom-llm'

/** User-facing hint when a custom OpenAI-compatible endpoint returns HTTP errors. */
export function formatCustomLlmHttpError(message: string, status: number): string {
  const trimmed = message.trim()
  const lower = trimmed.toLowerCase()

  if (
    status === 404 ||
    lower.includes('404') ||
    lower.includes('page not found') ||
    lower.includes('not found')
  ) {
    const hints = [
      'Endpoint returned 404 (Not Found).',
      'In Settings → API, set baseURL to the API root (e.g. https://integrate.api.nvidia.com/v1), not …/chat/completions.',
      'Use the exact model id from your provider catalog (NVIDIA: meta/llama-3.1-8b-instruct, not llama3.2).'
    ]
    if (trimmed && !lower.includes('404 page not found')) {
      return `${hints.join(' ')} Server: ${trimmed}`
    }
    return hints.join(' ')
  }

  if (status === 401 || status === 403) {
    const hint =
      'Authentication failed. In Settings → API (Custom server), paste the full nvapi-… key into **Custom endpoint API key** (not OpenRouter). Re-save after import — keys are not stored in the JSON profile.'
    if (lower.includes('authentication failed') || lower.includes('unauthorized')) {
      return hint
    }
    return trimmed ? `${trimmed} ${hint}` : hint
  }

  return trimmed || `API request failed (${status})`
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost') return true
  if (host === '::1') return true
  if (host.startsWith('127.')) return true
  return false
}

/** Local Ollama/LM Studio often need no key; cloud / LAN hosts usually do. */
export function customEndpointRequiresApiKey(baseUrl: string): boolean {
  const trimmed = baseUrl.trim()
  if (!trimmed) return true
  try {
    return !isLoopbackHost(new URL(normalizeCustomApiRootUrl(trimmed)).hostname)
  } catch {
    return true
  }
}

export function validateCustomProviderModelId(baseUrl: string, modelId: string): string | null {
  try {
    const host = new URL(normalizeCustomApiRootUrl(baseUrl)).hostname
    if (!host.includes('nvidia.com')) return null
  } catch {
    return null
  }

  if (modelId.includes('/')) return null
  return `NVIDIA models need a catalog id (e.g. meta/llama-3.1-8b-instruct), not "${modelId}". Pick one at build.nvidia.com.`
}
