const LATEX_SIGNAL =
  /\\[a-zA-Z]+|[_^{}]|\\int|\\frac|\\left|\\right|\\bigl|\\bigr|\\Bigl|\\Bigr|\\big|\\sin|\\cos|\\tan|\\sinh|\\cosh|\\tanh|\\ln|\\log|\\Gamma|\\pi|\\alpha|\\beta|\\sum|\\sqrt|\\arcsin|\\arccos|\\arctan|\\det|\\lim|\\infty|\\partial|\\nabla|\\cdot|\\times|\\leq|\\geq|\\neq|\\approx/

export function looksLikeLatex(text: string): boolean {
  return LATEX_SIGNAL.test(text)
}

/** Fixes common AI typos so KaTeX can render. */
export function sanitizeAiLatex(latex: string): string {
  return (
    latex
      .replace(/(\\[a-zA-Z]+)!/g, '$1')
      .replace(/_(\d+)!/g, '_$1')
      .replace(/\^{!(\d+)/g, '^{$1}')
      .replace(/!+(?=\\bigl|\\big|\\left|\\Bigr|\\right)/gi, '')
      .replace(/!!+/g, ' ')
      .replace(/;([=+\-*/]);/g, ' $1 ')
      .replace(/;+;/g, ' ')
      .replace(/\s*;\s*/g, ' ')
      .replace(/\{,/g, '{')
      .replace(/,\}/g, '}')
      .replace(/,\]/g, ']')
      .replace(/,\)/g, ')')
      .replace(/,\^/g, '^')
      .replace(/,\s*,/g, ',')
      .replace(/,\s*([)\]])/g, '$1')
      .replace(/,\s*\\bigl/gi, '\\bigl')
      .replace(/,\s*\\Bigl/g, '\\Bigl')
      .replace(/\^{(\d+)}!/g, '^{$1}')
      .replace(/,\s*dt\b/g, '\\,dt')
      .replace(/,\s*dx\b/g, '\\,dx')
      .replace(/\s+([+\-=])\s+/g, ' $1 ')
      .replace(/\.\s*$/g, '')
      .trim()
  )
}

export function isDisplayMath(inner: string): boolean {
  const t = inner.trim()
  if (/\\displaystyle/.test(t)) return true
  if (/\\begin\{(align|equation|gather|multline)/.test(t)) return true
  if (/\n/.test(t)) return true
  if (t.length > 90) return true
  if ((/\\frac|\\int|\\sum|\\prod|\\lim|\\oint/.test(t)) && t.length > 20) return true
  return false
}
