export const MAX_COMPOSER_ATTACHMENTS = 5
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024
export const MAX_TEXT_FILE_BYTES = 256 * 1024
export const MAX_TEXT_CHARS_IN_API = 12_000

export const IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp'
])

export const TEXT_FILE_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.json',
  '.csv',
  '.xml',
  '.html',
  '.css',
  '.js',
  '.ts',
  '.tsx',
  '.jsx',
  '.py',
  '.rs',
  '.go',
  '.java',
  '.c',
  '.cpp',
  '.yaml',
  '.yml',
  '.sql'
])
