import {
  isValidCustomApiBaseUrl,
  isValidCustomModelId,
  normalizeCustomApiBaseUrl,
  normalizeCustomModelId
} from '@/shared/config/custom-llm'
import { customLlmConfig } from '@/shared/config/custom-llm'

/** User-edited JSON profile for custom OpenAI-compatible endpoints. */
export interface CustomLlmProfile {
  baseURL: string
  model: string
  /** Merged into each POST /chat/completions body (after model & messages). */
  completion?: Record<string, unknown>
}

export type ParsedCustomLlmProfile = {
  profile: CustomLlmProfile
  baseUrl: string
  model: string
  completionExtras: Record<string, unknown>
}

const RESERVED_COMPLETION_KEYS = new Set(['messages', 'model', 'max_tokens', 'temperature'])

export const DEFAULT_CUSTOM_LLM_PROFILE: CustomLlmProfile = {
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  completion: {
    stream: false
  }
}

export function defaultCustomLlmProfileJson(): string {
  return stringifyCustomLlmProfile(DEFAULT_CUSTOM_LLM_PROFILE)
}

export function stringifyCustomLlmProfile(profile: CustomLlmProfile): string {
  return `${JSON.stringify(profile, null, 2)}\n`
}

/** Strip // and block comments for JSON.parse (JSONC-lite). */
export function stripJsonComments(source: string): string {
  let out = ''
  let i = 0
  while (i < source.length) {
    if (source[i] === '"') {
      const start = i
      i++
      while (i < source.length) {
        if (source[i] === '\\') {
          i += 2
          continue
        }
        if (source[i] === '"') {
          i++
          break
        }
        i++
      }
      out += source.slice(start, i)
      continue
    }
    if (source[i] === '/' && source[i + 1] === '/') {
      i += 2
      while (i < source.length && source[i] !== '\n') i++
      continue
    }
    if (source[i] === '/' && source[i + 1] === '*') {
      i += 2
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++
      i += 2
      continue
    }
    out += source[i]
    i++
  }
  return out
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeCompletionExtras(
  completion: unknown
): Record<string, unknown> | undefined {
  if (completion === undefined) return undefined
  if (!isPlainObject(completion)) {
    throw new Error('"completion" must be a JSON object.')
  }
  const extras: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(completion)) {
    if (RESERVED_COMPLETION_KEYS.has(key)) {
      throw new Error(
        `"completion.${key}" is reserved — set model on the profile root; Lingo sends messages and max_tokens.`
      )
    }
    extras[key] = value
  }
  return Object.keys(extras).length > 0 ? extras : undefined
}

export function parseCustomLlmProfileSource(
  source: string
): { ok: true; data: ParsedCustomLlmProfile } | { ok: false; error: string } {
  const trimmed = source.trim()
  if (!trimmed) {
    return { ok: false, error: 'Profile is empty.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stripJsonComments(trimmed))
  } catch {
    return { ok: false, error: 'Invalid JSON. Check commas and quotes.' }
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, error: 'Profile must be a JSON object.' }
  }

  const baseURL =
    typeof parsed.baseURL === 'string'
      ? parsed.baseURL
      : typeof parsed.baseUrl === 'string'
        ? parsed.baseUrl
        : ''
  const model = typeof parsed.model === 'string' ? parsed.model : ''

  let baseUrl = normalizeCustomApiBaseUrl(baseURL)
  if (baseUrl && !/\/v\d+$/i.test(baseUrl) && !/\/chat\/completions$/i.test(baseUrl)) {
    baseUrl = `${baseUrl}/v1`
  }
  const modelId = normalizeCustomModelId(model)

  if (!baseUrl) return { ok: false, error: 'Missing "baseURL".' }
  if (!isValidCustomApiBaseUrl(baseUrl)) {
    return {
      ok: false,
      error: 'Invalid baseURL — use http(s) and usually end with /v1.'
    }
  }
  if (!modelId) return { ok: false, error: 'Missing "model".' }
  if (!isValidCustomModelId(modelId)) {
    return { ok: false, error: 'Invalid "model" id.' }
  }

  let completionExtras: Record<string, unknown> = {}
  try {
    const extras = normalizeCompletionExtras(parsed.completion)
    if (extras) completionExtras = extras
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid completion block.' }
  }

  const profile: CustomLlmProfile = {
    baseURL: baseUrl,
    model: modelId,
    ...(Object.keys(completionExtras).length > 0 ? { completion: completionExtras } : {})
  }

  return {
    ok: true,
    data: { profile, baseUrl, model: modelId, completionExtras }
  }
}

export function profileFromLegacyFields(
  baseUrl: string,
  model: string
): CustomLlmProfile {
  return {
    baseURL: normalizeCustomApiBaseUrl(baseUrl) || customLlmConfig.defaultBaseUrl,
    model: normalizeCustomModelId(model) || customLlmConfig.defaultModel
  }
}

/** Best-effort import from OpenAI SDK-style snippets. */
export function importCustomLlmProfileFromSnippet(code: string): string | null {
  const baseURL =
    extractQuotedProp(code, 'baseURL') ?? extractQuotedProp(code, 'baseUrl')
  const model = extractQuotedProp(code, 'model')
  if (!baseURL && !model) return null

  const completion: Record<string, unknown> = {}

  const thinkingRaw = extractInlineObject(code, 'thinking')
  if (thinkingRaw) {
    try {
      completion.thinking = JSON.parse(thinkingRaw.replace(/'/g, '"'))
    } catch {
      completion.thinking = { type: 'enabled' }
    }
  }

  const reasoning = extractQuotedProp(code, 'reasoning_effort')
  if (reasoning) completion.reasoning_effort = reasoning

  const streamMatch = code.match(/\bstream\s*:\s*(true|false)\b/i)
  if (streamMatch) completion.stream = streamMatch[1] === 'true'

  const profile: CustomLlmProfile = {
    baseURL: baseURL ?? customLlmConfig.defaultBaseUrl,
    model: model ?? customLlmConfig.defaultModel,
    ...(Object.keys(completion).length > 0 ? { completion } : {})
  }

  const parsed = parseCustomLlmProfileSource(stringifyCustomLlmProfile(profile))
  return parsed.ok ? stringifyCustomLlmProfile(parsed.data.profile) : null
}

function extractQuotedProp(code: string, key: string): string | undefined {
  const re = new RegExp(`\\b${key}\\s*:\\s*['"\`]([^'"\`]+)['"\`]`, 'i')
  return re.exec(code)?.[1]?.trim()
}

function extractInlineObject(code: string, key: string): string | undefined {
  const re = new RegExp(`\\b${key}\\s*:\\s*(\\{[^}]*\\})`, 'i')
  return re.exec(code)?.[1]
}

export function mergeCustomCompletionBody(
  body: Record<string, unknown>,
  extras: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!extras || Object.keys(extras).length === 0) return body
  return { ...body, ...extras }
}
