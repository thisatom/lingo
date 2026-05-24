import {
  isValidCustomApiBaseUrl,
  isValidCustomModelId,
  normalizeCustomApiRootUrl,
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

export type ParseCustomLlmProfileResult =
  | { ok: true; data: ParsedCustomLlmProfile; importedApiKey?: string }
  | { ok: false; error: string }

export type CustomLlmSnippetImport = {
  profileJson: string
  /** Raw API key without a "Bearer " prefix — store via secrets, not in profile JSON. */
  apiKey?: string
}

const RESERVED_COMPLETION_KEYS = new Set([
  'messages',
  'model',
  'max_tokens',
  'apiKey',
  'api_key',
  'authorization',
  'Authorization'
])

const PROFILE_SECRET_KEYS = ['apiKey', 'api_key'] as const

/** Payload fields that map to profile.completion (not Lingo-controlled). */
const PAYLOAD_COMPLETION_KEYS = [
  'stream',
  'temperature',
  'top_p',
  'frequency_penalty',
  'presence_penalty',
  'stop',
  'seed',
  'thinking',
  'reasoning_effort'
] as const

export const DEFAULT_CUSTOM_LLM_PROFILE: CustomLlmProfile = {
  baseURL: customLlmConfig.defaultBaseUrl,
  model: customLlmConfig.defaultModel,
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

export function parseCustomLlmProfileSource(source: string): ParseCustomLlmProfileResult {
  const trimmed = source.trim()
  if (!trimmed) {
    return { ok: false, error: 'Profile is empty.' }
  }

  if (!trimmed.startsWith('{')) {
    const imported = importCustomLlmProfileFromSnippet(trimmed)
    if (!imported) {
      return {
        ok: false,
        error:
          'Could not read endpoint settings. Paste JSON or an axios / OpenAI SDK snippet.'
      }
    }
    const inner = parseCustomLlmProfileSource(imported.profileJson)
    if (!inner.ok) return inner
    return { ...inner, importedApiKey: imported.apiKey ?? inner.importedApiKey }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stripJsonComments(trimmed))
  } catch {
    const imported = importCustomLlmProfileFromSnippet(trimmed)
    if (!imported) {
      return { ok: false, error: 'Invalid JSON. Check commas and quotes.' }
    }
    const inner = parseCustomLlmProfileSource(imported.profileJson)
    if (!inner.ok) return inner
    return { ...inner, importedApiKey: imported.apiKey ?? inner.importedApiKey }
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, error: 'Profile must be a JSON object.' }
  }

  let importedApiKey: string | undefined
  for (const key of PROFILE_SECRET_KEYS) {
    const raw = parsed[key]
    if (typeof raw !== 'string' || !raw.trim()) continue
    importedApiKey = raw.trim().replace(/^Bearer\s+/i, '')
    break
  }

  const baseURL =
    typeof parsed.baseURL === 'string'
      ? parsed.baseURL
      : typeof parsed.baseUrl === 'string'
        ? parsed.baseUrl
        : ''
  const model = typeof parsed.model === 'string' ? parsed.model : ''

  const baseUrl = normalizeCustomApiRootUrl(baseURL)
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
    data: { profile, baseUrl, model: modelId, completionExtras },
    ...(importedApiKey ? { importedApiKey } : {})
  }
}

export function profileFromLegacyFields(
  baseUrl: string,
  model: string
): CustomLlmProfile {
  return {
    baseURL: normalizeCustomApiRootUrl(baseUrl) || customLlmConfig.defaultBaseUrl,
    model: normalizeCustomModelId(model) || customLlmConfig.defaultModel
  }
}

/** Best-effort import from axios, fetch, or OpenAI SDK snippets. */
export function importCustomLlmProfileFromSnippet(code: string): CustomLlmSnippetImport | null {
  const trimmed = code.trim()
  if (!trimmed) return null

  const baseURL =
    extractQuotedConst(trimmed, 'invokeUrl') ??
    extractQuotedConst(trimmed, 'url') ??
    extractAxiosPostUrl(trimmed) ??
    extractQuotedProp(trimmed, 'baseURL') ??
    extractQuotedProp(trimmed, 'baseUrl')

  const payload =
    extractConstObjectLiteral(trimmed, 'payload') ??
    extractConstObjectLiteral(trimmed, 'body')

  const model = extractModelFromSnippet(trimmed, payload)

  if (!baseURL && !model) return null

  const apiKey = extractBearerToken(trimmed)
  const completion = completionExtrasFromSnippet(trimmed, payload)

  const profile: CustomLlmProfile = {
    baseURL: baseURL ?? customLlmConfig.defaultBaseUrl,
    model: model ?? customLlmConfig.defaultModel,
    ...(Object.keys(completion).length > 0 ? { completion } : {})
  }

  const normalized = parseCustomLlmProfileSource(stringifyCustomLlmProfile(profile))
  if (!normalized.ok) return null

  return {
    profileJson: stringifyCustomLlmProfile(normalized.data.profile),
    apiKey
  }
}

function completionExtrasFromSnippet(
  code: string,
  payload: Record<string, unknown> | null
): Record<string, unknown> {
  const completion: Record<string, unknown> = {}

  if (payload) {
    for (const key of PAYLOAD_COMPLETION_KEYS) {
      if (key in payload && payload[key] !== undefined) {
        completion[key] = payload[key]
      }
    }
  }

  const thinkingRaw = extractInlineObject(code, 'thinking')
  if (thinkingRaw && !('thinking' in completion)) {
    try {
      completion.thinking = JSON.parse(thinkingRaw.replace(/'/g, '"'))
    } catch {
      completion.thinking = { type: 'enabled' }
    }
  }

  const reasoning = extractQuotedProp(code, 'reasoning_effort')
  if (reasoning && !('reasoning_effort' in completion)) {
    completion.reasoning_effort = reasoning
  }

  if (!('stream' in completion)) {
    const streamMatch = code.match(/\bstream\s*:\s*(true|false)\b/i)
    if (streamMatch) completion.stream = streamMatch[1] === 'true'
  }

  return completion
}

function extractQuotedConst(code: string, name: string): string | undefined {
  const re = new RegExp(`\\b${name}\\s*=\\s*['"\`]([^'"\`]+)['"\`]`, 'i')
  return re.exec(code)?.[1]?.trim()
}

function extractAxiosPostUrl(code: string): string | undefined {
  const m = code.match(/axios\.(?:post|put|patch)\s*\(\s*['"\`]([^'"\`]+)['"\`]/i)
  return m?.[1]?.trim()
}

function extractBearerToken(code: string): string | undefined {
  const headers = extractConstObjectLiteral(code, 'headers')
  if (headers && typeof headers.Authorization === 'string') {
    const auth = headers.Authorization.trim()
    const bearer = auth.match(/^Bearer\s+(.+)$/i)
    if (bearer) return bearer[1].trim()
  }
  const inline = code.match(/['"]Authorization['"]\s*:\s*['"]Bearer\s+([^'"]+)['"]/i)
  return inline?.[1]?.trim()
}

function extractBalancedBlock(source: string, openPos: number): string | null {
  const open = source[openPos]
  const close = open === '{' ? '}' : open === '[' ? ']' : null
  if (!close) return null

  let depth = 0
  let inString: '"' | "'" | '`' | null = null
  let escape = false

  for (let i = openPos; i < source.length; i++) {
    const ch = source[i]
    if (inString) {
      if (escape) {
        escape = false
        continue
      }
      if (ch === '\\') {
        escape = true
        continue
      }
      if (ch === inString) inString = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
      continue
    }
    if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return source.slice(openPos, i + 1)
    }
  }
  return null
}

function parseLooseJsObject(block: string, snippetSource?: string): Record<string, unknown> | null {
  let json = stripJsonComments(block)
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
  json = json.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
  json = json.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
  const streamConst = snippetSource?.match(/\bconst\s+stream\s*=\s*(true|false)/i)?.[1]
  if (streamConst) {
    json = json.replace(/(:\s*)stream(\s*[,}\]])/gi, `$1${streamConst}$2`)
  }
  json = json.replace(/,\s*([}\]])/g, '$1')
  try {
    const value = JSON.parse(json)
    return isPlainObject(value) ? value : null
  } catch {
    return null
  }
}

function extractModelFromSnippet(
  code: string,
  payload: Record<string, unknown> | null
): string | undefined {
  if (payload && typeof payload.model === 'string' && payload.model.trim()) {
    return payload.model.trim()
  }
  const jsonStyle = /"model"\s*:\s*"([^"]+)"/i.exec(code)?.[1]?.trim()
  if (jsonStyle) return jsonStyle
  return extractQuotedProp(code, 'model')
}

function extractConstObjectLiteral(
  source: string,
  name: string
): Record<string, unknown> | null {
  const decl = new RegExp(`\\b(?:const|let|var)\\s+${name}\\s*=\\s*\\{`, 'i')
  const match = decl.exec(source)
  if (!match) return null
  const braceStart = match.index + match[0].length - 1
  const block = extractBalancedBlock(source, braceStart)
  if (!block) return null
  return parseLooseJsObject(block, source)
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
  const merged = { ...body, ...extras }
  for (const key of RESERVED_COMPLETION_KEYS) {
    if (key in body) merged[key] = body[key]
  }
  return merged
}
