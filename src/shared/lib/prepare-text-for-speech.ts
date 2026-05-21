/**
 * Final plain-text cleanup before TTS (after markdown strip).
 * Improves pacing and reduces odd pauses from punctuation artifacts.
 */

/** Normalize ellipsis and repeated sentence punctuation for steadier pacing. */
function normalizePunctuation(text: string): string {
  let s = text
  s = s.replace(/\.{4,}/g, '…')
  s = s.replace(/\.{2,}/g, '…')
  s = s.replace(/…+/g, '…')
  s = s.replace(/\s*…\s*/g, ', ')
  s = s.replace(/([.!?])\1+/g, '$1')
  s = s.replace(/\s+([,;:!?])/g, '$1')
  s = s.replace(/([,;:])([^\s])/g, '$1 $2')
  return s
}

export function prepareTextForSpeech(text: string, _locale?: string): string {
  let s = text.replace(/\s+/g, ' ').trim()
  if (!s) return ''
  s = normalizePunctuation(s)
  return s.trim()
}
