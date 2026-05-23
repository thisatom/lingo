/** Collapse over-escaped LaTeX delimiters from model / JSON output. */
export function normalizeMathDelimiters(text: string): string {
  return text
    .replace(/\\{2,}(?=\()/g, '\\')
    .replace(/\\{2,}(?=\))/g, '\\')
    .replace(/\\{2,}(?=\[)/g, '\\')
    .replace(/\\{2,}(?=\])/g, '\\')
}
