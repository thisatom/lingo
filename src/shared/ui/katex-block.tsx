import katex from 'katex'
import { memo, useMemo } from 'react'
import { sanitizeAiLatex } from '@/shared/lib/math/latex'
import { cn } from '@/shared/lib/utils'
import { typography } from '@/shared/ui/typography'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface KaTeXBlockProps {
  latex: string
  displayMode: boolean
  className?: string
}

function KaTeXBlockInner({ latex, displayMode, className }: KaTeXBlockProps) {
  const html = useMemo(() => {
    const src = sanitizeAiLatex(latex)
    if (!src) return ''

    try {
      return katex.renderToString(src, {
        displayMode,
        strict: 'ignore',
        throwOnError: false,
        trust: false,
        output: 'html'
      })
    } catch {
      return `<span class="katex-error">${escapeHtml(latex)}</span>`
    }
  }, [latex, displayMode])

  if (!html) return null

  const Tag = displayMode ? 'div' : 'span'
  return (
    <Tag
      className={cn(
        displayMode ? typography.mathDisplayWrap : typography.mathInlineWrap,
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export const KaTeXBlock = memo(KaTeXBlockInner)
