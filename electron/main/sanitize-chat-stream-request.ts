import type { WebContents } from 'electron'
import { resolveChatCompletionsUrl } from '@/shared/config/custom-llm'
import {
  buildChatStreamLlmFields,
  resolveChatStreamWebSearch
} from '@/shared/lib/resolve-chat-stream-llm'
import { assertOutboundHttpUrl } from '@/shared/lib/outbound-url-policy'
import type { ChatStreamRequest } from '@/shared/types/ipc'
import { readPersistedLlmSnapshot } from './persisted-llm-settings'

/** Trust messages from renderer; LLM routing from persisted settings in main. */
export async function sanitizeChatStreamRequest(
  request: ChatStreamRequest,
  webContents: WebContents
): Promise<ChatStreamRequest> {
  const snapshot = await readPersistedLlmSnapshot(webContents)
  const { messages, practiceLanguage, webSearch: perTurnWebSearch } = request

  if (!snapshot) {
    return {
      messages,
      practiceLanguage,
      webSearch: perTurnWebSearch === true,
      llmBackend: 'openrouter'
    }
  }

  const llmSettings = {
    llmBackend: snapshot.llmBackend,
    modelId: snapshot.modelId,
    customApiBaseUrl: snapshot.customApiBaseUrl,
    customModelId: snapshot.customModelId,
    customLlmProfileJson: snapshot.customLlmProfileJson,
    webSearchEnabled: snapshot.webSearchEnabled,
    modelAutoFallback: snapshot.modelAutoFallback,
    llmMaxTokens: snapshot.llmMaxTokens
  }
  const llmFields = buildChatStreamLlmFields(llmSettings)

  if (llmFields.llmBackend === 'custom' && llmFields.customLlm?.baseUrl) {
    const target = resolveChatCompletionsUrl(llmFields.customLlm.baseUrl)
    assertOutboundHttpUrl(target, { allowPrivateNetwork: true })
  }

  return {
    messages,
    practiceLanguage,
    ...llmFields,
    webSearch: resolveChatStreamWebSearch(llmSettings, perTurnWebSearch)
  }
}
