import { isValidElement, useCallback, useRef, useState, type ReactNode } from 'react'
import { Check, Copy } from '@/shared/ui/icons'
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard'
import { cn } from '@/shared/lib/utils'
import { typography } from '@/shared/ui/typography'
import { extractCodeLanguage, formatCodeLanguageLabel } from '@/shared/ui/markdown/markdown-utils'

function extractTextFromChildren(children: ReactNode): string {
  if (children == null || typeof children === 'boolean') return ''
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('')
  }
  if (isValidElement(children)) {
    const nested = (children.props as { children?: ReactNode }).children
    return extractTextFromChildren(nested)
  }
  return ''
}

function languageFromPreChildren(children: ReactNode): string | null {
  if (!isValidElement(children)) return null
  const props = children.props as { className?: string }
  return extractCodeLanguage(props.className)
}

interface MarkdownCodeBlockProps {
  children?: ReactNode
  className?: string
}

export function MarkdownCodeBlock({ children, className }: MarkdownCodeBlockProps) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const language = extractCodeLanguage(className) ?? languageFromPreChildren(children)
  const label = language ? formatCodeLanguageLabel(language) : 'Code'

  const handleCopy = useCallback(async () => {
    const text = preRef.current?.textContent?.trim() ?? extractTextFromChildren(children).trim()
    if (!text) return
    const ok = await copyToClipboard(text)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }, [children])

  return (
    <div className={typography.codeBlock}>
      <div className={typography.codeBlockHeader}>
        <span className="truncate">{label}</span>
        <button
          type="button"
          className={typography.codeBlockCopyButton}
          aria-label={copied ? 'Copied' : 'Copy code'}
          onClick={() => void handleCopy()}
        >
          {copied ? <Check className="size-3 shrink-0" aria-hidden /> : <Copy className="size-3 shrink-0" aria-hidden />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre ref={preRef} className={cn(typography.pre, 'p-3', className)}>
        {children}
      </pre>
    </div>
  )
}
