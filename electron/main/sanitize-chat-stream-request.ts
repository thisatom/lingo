import type { WebContents } from 'electron'
import { resolveChatCompletionsUrl } from '@/shared/config/custom-llm'
import { buildChatStreamLlmFields } from '@/shared/lib/resolve-chat-stream-llm'
import { assertOutboundHttpUrl } from '@/shared/lib/outbound-url-policy'
import type { ChatStreamRequest } from '@/shared/types/ipc'
import { readPersistedLlmSnapshot } from './persisted-llm-settings'

/** Trust messages from renderer; LLM routing from persisted settings in main. */
export async function sanitizeChatStreamRequest(
  request: ChatStreamRequest,
  webContents: WebContents
): Promise<ChatStreamRequest> {
  const snapshot = await readPersistedLlmSnapshot(webContents)
  const { webSearch, messages, practiceLanguage } = request

  if (!snapshot) {
    return {
      messages,
      practiceLanguage,
      webSearch,
      llmBackend: 'openrouter'
    }
  }

  const llmFields = buildChatStreamLlmFields({
    llmBackend: snapshot.llmBackend,
    modelId: snapshot.modelId,
    customApiBaseUrl: snapshot.customApiBaseUrl,
    customModelId: snapshot.customModelId,
    customLlmProfileJson: snapshot.customLlmProfileJson,
    webSearchEnabled: snapshot.webSearchEnabled,
    modelAutoFallback: snapshot.modelAutoFallback,
    llmMaxTokens: snapshot.llmMaxTokens
  })

  if (llmFields.llmBackend === 'custom' && llmFields.customLlm?.baseUrl) {
    const target = resolveChatCompletionsUrl(llmFields.customLlm.baseUrl)
    assertOutboundHttpUrl(target, { allowPrivateNetwork: true })
  }

  return {
    messages,
    practiceLanguage,
    webSearch,
    ...llmFields
  }
}
