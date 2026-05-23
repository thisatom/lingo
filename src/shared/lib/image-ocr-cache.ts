import { extractImageText } from '@/shared/lib/image-ocr-runtime'

const MAX_ENTRIES = 32
const ocrCache = new Map<string, string>()

function ocrCacheKey(dataUrl: string): string {
  if (dataUrl.length <= 240) return dataUrl
  return `${dataUrl.length}:${dataUrl.slice(0, 120)}:${dataUrl.slice(-120)}`
}

export function clearImageOcrCache(): void {
  ocrCache.clear()
}

export async function extractImageTextCached(dataUrl: string): Promise<string> {
  const key = ocrCacheKey(dataUrl)
  const cached = ocrCache.get(key)
  if (cached !== undefined) return cached

  const text = await extractImageText(dataUrl)
  ocrCache.set(key, text)
  if (ocrCache.size > MAX_ENTRIES) {
    const oldest = ocrCache.keys().next().value
    if (oldest) ocrCache.delete(oldest)
  }
  return text
}
