export type ImageOcrFn = (dataUrl: string) => Promise<string>

let imageOcrFn: ImageOcrFn | null = null

export function registerImageOcr(fn: ImageOcrFn): void {
  imageOcrFn = fn
}

export function isImageOcrRegistered(): boolean {
  return imageOcrFn != null
}

export async function extractImageText(dataUrl: string): Promise<string> {
  if (!imageOcrFn) return ''
  return imageOcrFn(dataUrl)
}
