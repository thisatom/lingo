import { normalizeOpenRouterModelId } from '@/shared/config/openrouter'
import type { ChatContentPart, ChatMessagePayload } from '@/shared/types/ipc'

/** Models known to accept OpenAI-style `image_url` parts on OpenRouter. */
export const openRouterVisionModels: readonly string[] = [
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/gpt-4.1',
  'openai/gpt-4.1-mini',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.7-sonnet',
  'anthropic/claude-sonnet-4',
  'google/gemini-2.0-flash-001',
  'google/gemini-2.5-flash-preview',
  'google/gemini-2.5-pro-preview',
  'meta-llama/llama-3.2-90b-vision-instruct',
  'mistralai/pixtral-12b',
  'qwen/qwen-vl-plus'
]

const VISION_MODEL_KEYS = new Set(
  openRouterVisionModels.map((m) => normalizeOpenRouterModelId(m).toLowerCase())
)

const VISION_ID_PATTERNS = [
  /gpt-4o/,
  /gpt-4\.1/,
  /gemini-2/,
  /gemini-2\.5/,
  /claude-3\.5/,
  /claude-3\.7/,
  /claude-sonnet-4/,
  /claude-4/,
  /llava/,
  /pixtral/,
  /qwen-vl/,
  /vision/,
  /vl-/
]

export function isVisionCapableModel(modelId: string): boolean {
  const id = normalizeOpenRouterModelId(modelId).toLowerCase()
  if (!id) return false
  if (VISION_MODEL_KEYS.has(id)) return true
  return VISION_ID_PATTERNS.some((re) => re.test(id))
}

/** @deprecated Vision fallback uses OCR + user's model instead of switching models. */
export function resolveVisionModel(userModelId: string): string {
  return userModelId.trim()
}

export function contentPartHasImage(part: ChatContentPart): boolean {
  return (
    part.type === 'image_url' &&
    Boolean(part.image_url.url?.trim()) &&
    part.image_url.url.startsWith('data:')
  )
}

export function payloadHasImages(content: ChatMessagePayload['content']): boolean {
  if (typeof content === 'string') return false
  return content.some(contentPartHasImage)
}

export function messagesHaveImages(messages: ChatMessagePayload[]): boolean {
  return messages.some((m) => payloadHasImages(m.content))
}
