import fs from 'node:fs/promises'
import path from 'node:path'
import {
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_TEXT_FILE_BYTES,
  TEXT_FILE_EXTENSIONS
} from '../../src/features/chat-attachments/lib/constants'
import type { DroppedFileReadResult } from '../../src/shared/types/ipc'

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])

const EXT_TO_IMAGE_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

function isImagePath(name: string, mimeType: string): boolean {
  if (mimeType && IMAGE_MIME_TYPES.has(mimeType)) return true
  return IMAGE_EXTENSIONS.has(extensionOf(name))
}

function isTextPath(name: string, mimeType: string): boolean {
  if (mimeType.startsWith('text/')) return true
  return TEXT_FILE_EXTENSIONS.has(extensionOf(name))
}

function imageMimeForPath(name: string, mimeType: string): string {
  if (mimeType && IMAGE_MIME_TYPES.has(mimeType)) return mimeType
  return EXT_TO_IMAGE_MIME[extensionOf(name)] ?? 'image/png'
}

async function readOne(filePath: string): Promise<DroppedFileReadResult | { error: string }> {
  const resolved = path.resolve(filePath)
  let stat: Awaited<ReturnType<typeof fs.stat>>
  try {
    stat = await fs.stat(resolved)
  } catch {
    return { error: `${path.basename(filePath)}: could not read file` }
  }

  if (!stat.isFile()) {
    return { error: `${path.basename(filePath)}: not a file` }
  }

  const name = path.basename(resolved)
  const mimeType = ''

  if (isImagePath(name, mimeType)) {
    if (stat.size > MAX_IMAGE_BYTES) {
      return { error: `${name}: image must be under 4 MB` }
    }
    const buf = await fs.readFile(resolved)
    const imageMime = imageMimeForPath(name, mimeType)
    return {
      name,
      mimeType: imageMime,
      sizeBytes: stat.size,
      kind: 'image',
      payload: `data:${imageMime};base64,${buf.toString('base64')}`
    }
  }

  if (isTextPath(name, mimeType)) {
    if (stat.size > MAX_TEXT_FILE_BYTES) {
      return { error: `${name}: text file must be under 256 KB` }
    }
    const text = await fs.readFile(resolved, 'utf8')
    return {
      name,
      mimeType: 'text/plain',
      sizeBytes: stat.size,
      kind: 'text',
      payload: text
    }
  }

  return { error: `${name}: unsupported type (images or text/code files only)` }
}

export async function readDroppedFilePaths(
  paths: string[]
): Promise<{ results: DroppedFileReadResult[]; errors: string[] }> {
  const results: DroppedFileReadResult[] = []
  const errors: string[] = []

  for (const filePath of paths) {
    const outcome = await readOne(filePath)
    if ('error' in outcome) {
      errors.push(outcome.error)
    } else {
      results.push(outcome)
    }
  }

  return { results, errors }
}
