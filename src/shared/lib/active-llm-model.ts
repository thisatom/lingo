import type { ChatStreamLlmSettings } from '@/shared/lib/resolve-chat-stream-llm'

/** Model id shown in UI and used for context metering. */
export function getActiveLlmModelId(
  settings: Pick<ChatStreamLlmSettings, 'llmBackend' | 'modelId' | 'customModelId'>
): string {
  return settings.llmBackend === 'custom' ? settings.customModelId : settings.modelId
}
