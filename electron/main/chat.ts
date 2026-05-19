import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import type { ChatCompleteRequest, ChatCompleteResponse } from '../../src/shared/types/ipc'
import { getSecret } from './secrets'
import { openRouterConfig } from '../../src/shared/config/openrouter'

function systemPrompt(practiceLanguage?: string): string {
  const lang = practiceLanguage ?? 'en'
  return `You are Lingo, a friendly language practice partner. The user is practicing conversational ${lang}.
Respond in ${lang} unless they use another language. Keep replies concise (2-4 sentences).
Gently correct mistakes when needed. Ask a follow-up question to keep the conversation going.`
}

export async function completeChat(request: ChatCompleteRequest): Promise<ChatCompleteResponse> {
  const apiKey = await getSecret('openrouter')
  if (!apiKey) throw new Error('NO_OPENROUTER_KEY')

  const modelId = request.model ?? process.env.LINGO_OPENROUTER_MODEL ?? openRouterConfig.defaultModel

  const openrouter = createOpenAI({
    baseURL: openRouterConfig.baseURL,
    apiKey,
    headers: {
      'HTTP-Referer': process.env.LINGO_APP_URL ?? 'https://github.com/lingo-app',
      'X-Title': process.env.LINGO_APP_NAME ?? 'Lingo'
    }
  })

  const { text } = await generateText({
    model: openrouter(modelId),
    system: systemPrompt(request.practiceLanguage),
    messages: request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
  })

  return { text }
}

export async function validateOpenRouterKey(): Promise<{ ok: boolean; error?: string }> {
  try {
    await completeChat({
      messages: [{ role: 'user', content: 'Hi' }],
      model: process.env.LINGO_OPENROUTER_MODEL ?? openRouterConfig.defaultModel
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Validation failed' }
  }
}
