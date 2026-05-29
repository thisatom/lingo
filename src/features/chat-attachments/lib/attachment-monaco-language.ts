import type { MessageAttachment } from '@/entities/message/model/attachment'

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

const EXTENSION_TO_MONACO: Record<string, string> = {
  '.txt': 'plaintext',
  '.md': 'markdown',
  '.json': 'json',
  '.csv': 'plaintext',
  '.xml': 'xml',
  '.html': 'html',
  '.css': 'css',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.rs': 'rust',
  '.go': 'go',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.sql': 'sql'
}

export function monacoLanguageForAttachment(attachment: MessageAttachment): string {
  const byExt = EXTENSION_TO_MONACO[extensionOf(attachment.name)]
  if (byExt) return byExt

  if (attachment.mimeType === 'application/json') return 'json'
  if (attachment.mimeType.includes('javascript')) return 'javascript'
  if (attachment.mimeType.includes('typescript')) return 'typescript'
  if (attachment.mimeType.startsWith('text/')) return 'plaintext'

  return 'plaintext'
}
