import { z } from 'zod'
import type {
  ChatCompleteRequest,
  ChatStreamRequest,
  LlmBackend,
  SecretProviderId,
  SttTranscribeRequest,
  TtsSynthesizeRequest
} from '@/shared/types/ipc'
import { SECRET_PROVIDER_IDS } from '@/shared/types/secret-providers'

export class IpcValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IpcValidationError'
  }
}

function formatZodError(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || 'root'}: ${i.message}`).join('; ')
}

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown, label: string): T {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new IpcValidationError(`${label}: ${formatZodError(result.error)}`)
  }
  return result.data
}

export const secretProviderIdSchema = z.enum(SECRET_PROVIDER_IDS)

export const llmBackendSchema = z.enum(['openrouter', 'custom'])

const chatContentPartSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string().max(500_000) }),
  z.object({
    type: z.literal('image_url'),
    image_url: z.object({ url: z.string().max(8_000_000) })
  })
])

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.union([z.string().max(500_000), z.array(chatContentPartSchema).max(64)])
})

const customLlmConfigSchema = z.object({
  baseUrl: z.string().max(4_096),
  model: z.string().max(256),
  completionExtras: z.record(z.unknown()).optional()
})

export const chatStreamRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(200),
  model: z.string().max(256).optional(),
  practiceLanguage: z.string().max(32).optional(),
  llmBackend: llmBackendSchema.optional(),
  customLlm: customLlmConfigSchema.optional(),
  webSearch: z.boolean().optional(),
  modelAutoFallback: z.boolean().optional(),
  maxTokens: z.number().int().min(0).max(128_000).optional(),
  maxTokensRetry: z.number().int().min(0).max(128_000).optional()
})

export const chatCompleteRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(200),
  model: z.string().max(256).optional(),
  practiceLanguage: z.string().max(32).optional()
})

export const sttTranscribeRequestSchema = z.object({
  audioBase64: z.string().min(1).max(25_000_000),
  format: z.string().min(1).max(32),
  language: z.string().max(32).optional(),
  model: z.string().max(128).optional()
})

export const ttsSynthesizeRequestSchema = z.object({
  text: z.string().min(1).max(50_000),
  voice: z.string().max(128).optional(),
  locale: z.string().max(32).optional(),
  rate: z.string().max(16).optional()
})

export const linkPreviewUrlSchema = z.string().trim().min(1).max(8_192)

export const streamChannelSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^lingo:chat:stream:[0-9a-f-]{36}$/i)

export function parseSecretProviderId(input: unknown): SecretProviderId {
  return parseOrThrow(secretProviderIdSchema, input, 'provider')
}

export function parseChatStreamRequest(input: unknown): ChatStreamRequest {
  return parseOrThrow(chatStreamRequestSchema, input, 'chat stream request')
}

export function parseChatCompleteRequest(input: unknown): ChatCompleteRequest {
  return parseOrThrow(chatCompleteRequestSchema, input, 'chat complete request')
}

export function parseSttTranscribeRequest(input: unknown): SttTranscribeRequest {
  return parseOrThrow(sttTranscribeRequestSchema, input, 'STT request')
}

export function parseTtsSynthesizeRequest(input: unknown): TtsSynthesizeRequest {
  return parseOrThrow(ttsSynthesizeRequestSchema, input, 'TTS request')
}

export function parseLinkPreviewUrl(input: unknown): string {
  return parseOrThrow(linkPreviewUrlSchema, input, 'link URL')
}

export function parseStreamChannel(input: unknown): string {
  return parseOrThrow(streamChannelSchema, input, 'stream channel')
}

export function parseLlmBackend(input: unknown): LlmBackend {
  return parseOrThrow(llmBackendSchema, input, 'llm backend')
}
