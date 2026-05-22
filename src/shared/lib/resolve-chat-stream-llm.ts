import {
  isValidCustomApiBaseUrl,
  normalizeCustomModelId
} from '@/shared/config/custom-llm'
import { parseCustomLlmProfileSource } from '@/shared/lib/custom-llm-profile'
import type { ChatStreamRequest, CustomLlmConfig, LlmBackend } from '@/shared/types/ipc'

export type ChatStreamLlmSettings = {
  llmBackend: LlmBackend
  modelId: string
  customApiBaseUrl: string
  customModelId: string
  customLlmProfileJson: string
  webSearchEnabled: boolean
  modelAutoFallback: boolean
}

function resolveCustomFromSettings(settings: ChatStreamLlmSettings): CustomLlmConfig | null {
  const fromJson = parseCustomLlmProfileSource(settings.customLlmProfileJson)
  if (fromJson.ok) {
    return {
      baseUrl: fromJson.data.baseUrl,
      model: fromJson.data.model,
      completionExtras: fromJson.data.completionExtras
    }
  }
  const baseUrl = settings.customApiBaseUrl.trim()
  const model = normalizeCustomModelId(settings.customModelId)
  if (!baseUrl || !model) return null
  return { baseUrl, model }
}

export function buildChatStreamLlmFields(
  settings: ChatStreamLlmSettings
): Pick<ChatStreamRequest, 'model' | 'llmBackend' | 'customLlm' | 'webSearch' | 'modelAutoFallback'> {
  if (settings.llmBackend === 'custom') {
    const customLlm = resolveCustomFromSettings(settings)
    if (!customLlm) {
      return {
        llmBackend: 'custom',
        model: '',
        customLlm: { baseUrl: '', model: '' },
        webSearch: false,
        modelAutoFallback: false
      }
    }
    return {
      llmBackend: 'custom',
      model: customLlm.model,
      customLlm,
      webSearch: false,
      modelAutoFallback: false
    }
  }

  return {
    llmBackend: 'openrouter',
    model: settings.modelId,
    webSearch: settings.webSearchEnabled,
    modelAutoFallback: settings.modelAutoFallback
  }
}

export function validateCustomLlmSettings(settings: ChatStreamLlmSettings): string | null {
  if (settings.llmBackend !== 'custom') return null
  const parsed = parseCustomLlmProfileSource(settings.customLlmProfileJson)
  if (!parsed.ok) {
    return parsed.error || 'Fix the custom endpoint profile in Settings → API.'
  }
  if (!isValidCustomApiBaseUrl(parsed.data.baseUrl)) {
    return 'Custom baseURL must be a valid http(s) URL (e.g. http://127.0.0.1:11434/v1).'
  }
  return null
}
