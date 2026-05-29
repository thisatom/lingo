import type { MessageAttachment } from '@/entities/message/model/attachment'
import { persistAttachment } from '@/entities/message/lib/prepare-attachment'
import {
  IMAGE_MIME_TYPES,
  MAX_COMPOSER_ATTACHMENTS,
  MAX_IMAGE_BYTES,
  MAX_TEXT_CHARS_IN_API,
  MAX_TEXT_FILE_BYTES,
  TEXT_FILE_EXTENSIONS
} from './constants'

function newAttachmentId(): string {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

function isTextFile(file: File): boolean {
  if (file.type.startsWith('text/')) return true
  return TEXT_FILE_EXTENSIONS.has(extensionOf(file.name))
}

function isImageFile(file: File): boolean {
  return IMAGE_MIME_TYPES.has(file.type)
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

async function fileToAttachment(file: File): Promise<MessageAttachment | null> {
  if (isImageFile(file)) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(`${file.name}: image must be under 4 MB`)
    }
    const payload = await readFileAsDataUrl(file)
    return {
      id: newAttachmentId(),
      kind: 'image',
      name: file.name,
      mimeType: file.type || 'image/png',
      payload,
      sizeBytes: file.size
    }
  }

  if (isTextFile(file)) {
    if (file.size > MAX_TEXT_FILE_BYTES) {
      throw new Error(`${file.name}: text file must be under 256 KB`)
    }
    const text = await readFileAsText(file)
    return {
      id: newAttachmentId(),
      kind: 'text',
      name: file.name,
      mimeType: file.type || 'text/plain',
      payload: text,
      sizeBytes: file.size
    }
  }

  throw new Error(`${file.name}: unsupported type (images or text/code files only)`)
}

export async function processDroppedFiles(
  files: File[],
  existingCount: number
): Promise<{ attachments: MessageAttachment[]; errors: string[] }> {
  const attachments: MessageAttachment[] = []
  const errors: string[] = []
  const slotsLeft = Math.max(0, MAX_COMPOSER_ATTACHMENTS - existingCount)

  if (slotsLeft === 0) {
    return { attachments: [], errors: ['Maximum 5 attachments per message.'] }
  }

  const batch = files.slice(0, slotsLeft)
  if (files.length > slotsLeft) {
    errors.push(`Only ${slotsLeft} more file(s) can be added.`)
  }

  for (const file of batch) {
    try {
      const att = await fileToAttachment(file)
      if (att) attachments.push(await persistAttachment(att))
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'Could not attach file')
    }
  }

  return { attachments, errors }
}

const EMPTY_DROP_HINT =
  'Could not read the dropped file. Try the attachment button or pick files with the paperclip.'

/**
 * Shared drop/paste pipeline: resolve blobs → process attachments, always surfaces failures.
 */
export function runComposerAttachmentPipeline(
  filesPromise: Promise<{ files: File[]; errors: string[] }>,
  existingCount: number,
  onAdd: (items: MessageAttachment[]) => void,
  onError?: (message: string) => void
): void {
  void filesPromise
    .then(({ files, errors: resolveErrors }) => {
      if (files.length === 0) {
        if (resolveErrors.length > 0) onError?.(resolveErrors.join(' '))
        else onError?.(EMPTY_DROP_HINT)
        return null
      }
      return processDroppedFiles(files, existingCount).then((result) => ({
        ...result,
        errors: [...resolveErrors, ...result.errors]
      }))
    })
    .then((result) => {
      if (!result) return
      if (result.attachments.length > 0) onAdd(result.attachments)
      if (result.errors.length > 0) onError?.(result.errors.join(' '))
    })
    .catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Could not attach dropped files'
      onError?.(message)
    })
}

export function runComposerAttachmentFiles(
  files: File[],
  existingCount: number,
  onAdd: (items: MessageAttachment[]) => void,
  onError?: (message: string) => void
): void {
  runComposerAttachmentPipeline(
    Promise.resolve({ files, errors: [] }),
    existingCount,
    onAdd,
    onError
  )
}
