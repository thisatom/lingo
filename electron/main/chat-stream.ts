import type { WebContents } from 'electron'
import type { ChatStreamEvent, ChatStreamRequest } from '../../src/shared/types/ipc'
import { openRouterConfig } from '../../src/shared/config/openrouter'
import { setupTesseractImageOcr } from '../../src/shared/lib/image-ocr-tesseract'
import { setupLocalWebSearch } from '../../src/shared/lib/setup-local-web-search'
import { streamOpenRouterChat } from '../../src/shared/lib/openrouter-chat-stream'
import { fetchOpenRouter } from './openrouter-fetch'
import { getSecret } from './secrets'
import { sanitizeChatStreamRequest } from './sanitize-chat-stream-request'

setupTesseractImageOcr()
setupLocalWebSearch()

export { normalizeOpenRouterModelId } from '../../src/shared/config/openrouter'

export async function streamChat(
  request: ChatStreamRequest,
  send: (event: ChatStreamEvent) => void,
  signal: AbortSignal | undefined,
  sender: WebContents
): Promise<void> {
  const safeRequest = await sanitizeChatStreamRequest(request, sender)
  const useCustom = safeRequest.llmBackend === 'custom'
  return streamOpenRouterChat(
    safeRequest,
    send,
    () => (useCustom ? getSecret('custom-llm') : getSecret('openrouter')),
    {
      defaultModel: process.env.LINGO_OPENROUTER_MODEL ?? openRouterConfig.defaultModel,
      fetchImpl: fetchOpenRouter
    },
    signal
  )
}
