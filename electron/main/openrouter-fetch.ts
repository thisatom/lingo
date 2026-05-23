import { Agent, fetch as undiciFetch } from 'undici'
import { openRouterConfig } from '../../src/shared/config/openrouter'

export type OpenRouterFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

let dispatcher: Agent | undefined

function getDispatcher(): Agent {
  dispatcher ??= new Agent({
    keepAliveTimeout: 60_000,
    keepAliveMaxTimeout: 120_000,
    connections: 4
  })
  return dispatcher
}

/** Warm TLS + keep-alive to OpenRouter (call once per app session). */
export async function warmOpenRouterConnection(): Promise<void> {
  try {
    await undiciFetch(`${openRouterConfig.baseURL}/models`, {
      method: 'HEAD',
      dispatcher: getDispatcher(),
      signal: AbortSignal.timeout(8_000)
    })
  } catch {
    // models HEAD may 401 without key — connection is still warmed
  }
}

export const fetchOpenRouter: OpenRouterFetch = (input, init) =>
  undiciFetch(input, {
    ...init,
    dispatcher: getDispatcher()
  }) as unknown as Promise<Response>
