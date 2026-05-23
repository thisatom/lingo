import type { ChatStreamEvent, ChatStreamRequest } from '../../src/shared/types/ipc'
import { openRouterConfig } from '../../src/shared/config/openrouter'
import { setupTesseractImageOcr } from '../../src/shared/lib/image-ocr-tesseract'
import { setupLocalWebSearch } from '../../src/shared/lib/setup-local-web-search'
import { streamOpenRouterChat } from '../../src/shared/lib/openrouter-chat-stream'
import { fetchOpenRouter } from './openrouter-fetch'
import { getSecret } from './secrets'

setupTesseractImageOcr()
setupLocalWebSearch()

export { normalizeOpenRouterModelId } from '../../src/shared/config/openrouter'

export async function streamChat(
  request: ChatStreamRequest,
  send: (event: ChatStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const useCustom = request.llmBackend === 'custom'
  return streamOpenRouterChat(
    request,
    send,
    () => (useCustom ? getSecret('custom-llm') : getSecret('openrouter')),
    {
      defaultModel: process.env.LINGO_OPENROUTER_MODEL ?? openRouterConfig.defaultModel,
      fetchImpl: fetchOpenRouter
    },
    signal
  )
}
