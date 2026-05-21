import { createWorker, type Worker } from 'tesseract.js'
import { registerImageOcr } from '@/shared/lib/image-ocr-runtime'

const LANGS = 'eng+rus'

let workerPromise: Promise<Worker> | null = null

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker(LANGS, 1, {
        logger: () => {}
      })
      return worker
    })()
  }
  return workerPromise
}

export async function extractTextFromImageDataUrl(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:')) return ''
  const worker = await getWorker()
  const { data } = await worker.recognize(dataUrl)
  return data.text.replace(/\s+/g, ' ').trim()
}

/** Registers Tesseract OCR for chat image fallback (Electron main + web). */
export function setupTesseractImageOcr(): void {
  registerImageOcr(extractTextFromImageDataUrl)
}
