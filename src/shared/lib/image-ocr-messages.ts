import type { ChatContentPart, ChatMessagePayload } from '@/shared/types/ipc'
import { extractImageTextCached } from '@/shared/lib/image-ocr-cache'
import { isImageOcrRegistered } from '@/shared/lib/image-ocr-runtime'
import { contentPartHasImage, messagesHaveImages } from '@/shared/lib/vision-models'

function formatOcrBlock(text: string): string {
  if (!text.trim()) {
    return '**Image (OCR):** no readable text was detected in the attached image.'
  }
  return `**Text extracted from image (OCR):**\n\`\`\`\n${text.trim()}\n\`\`\``
}

export function isVisionApiError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('image_url') ||
    m.includes('image url') ||
    m.includes('multimodal') ||
    (m.includes('vision') && (m.includes('not support') || m.includes('unsupported'))) ||
    (m.includes('does not support') && m.includes('image')) ||
    (m.includes('invalid') && m.includes('image')) ||
    (m.includes('content') && m.includes('image') && m.includes('support')) ||
    (m.includes('no endpoints') && m.includes('image')) ||
    m.includes('input type') && m.includes('image') ||
    m.includes('expected `text`') ||
    m.includes('only supports text')
  )
}

export async function substituteMessagesWithOcr(
  messages: ChatMessagePayload[]
): Promise<ChatMessagePayload[]> {
  if (!messagesHaveImages(messages)) return messages
  if (!isImageOcrRegistered()) {
    throw new Error(
      'Image OCR is not available in this environment. Use a vision-capable model or the desktop app.'
    )
  }

  const out: ChatMessagePayload[] = []

  for (const message of messages) {
    if (typeof message.content === 'string' || message.role !== 'user') {
      out.push(message)
      continue
    }

    const hasImage = message.content.some(contentPartHasImage)
    if (!hasImage) {
      out.push(message)
      continue
    }

    const parts: ChatContentPart[] = []
    for (const part of message.content) {
      if (part.type === 'text') {
        parts.push(part)
        continue
      }
      if (part.type === 'image_url' && part.image_url.url?.startsWith('data:')) {
        const extracted = await extractImageTextCached(part.image_url.url)
        parts.push({ type: 'text', text: formatOcrBlock(extracted) })
      }
    }

    out.push({ ...message, content: parts })
  }

  return out
}
