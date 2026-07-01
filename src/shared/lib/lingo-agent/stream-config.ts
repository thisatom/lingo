function readEnvFlag(): boolean | undefined {
  const raw =
    (typeof process !== 'undefined' && process.env?.LINGO_AI_SDK_STREAM) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LINGO_AI_SDK_STREAM)

  if (raw === undefined || raw === '') return undefined
  if (raw === '0' || raw === 'false') return false
  if (raw === '1' || raw === 'true') return true
  return undefined
}

function isVitestRun(): boolean {
  return typeof process !== 'undefined' && process.env.VITEST === 'true'
}

function isWebRenderer(): boolean {
  return typeof import.meta !== 'undefined' && import.meta.env?.VITE_LINGO_PLATFORM === 'web'
}

/** AI SDK stream path: on in desktop by default; legacy SSE in Vitest and web (strict CSP, no eval). */
export function isAiSdkStreamEnabled(): boolean {
  if (isWebRenderer()) return false
  const override = readEnvFlag()
  if (override !== undefined) return override
  return !isVitestRun()
}

export function shouldUseAiSdkStreamForRequest(request: {
  llmBackend?: string
}): boolean {
  if (!isAiSdkStreamEnabled()) return false
  return request.llmBackend !== 'custom'
}
