/** Max leading spaces to strip before block markers (4+ spaces = indented code block in CommonMark). */
const MAX_BLOCK_INDENT = 4

const BLOCK_LINE =
  /^( {1,4})((?:#{1,6}\s|[-*+]\s|[-*+]\s\[[ xX]\]\s|\d+\.\s+|>\s?|```|~~~|(?:-{3,}|_{3,}|\*{3,})(?:\s|$)|\|(?:\s*[-:]+[-| :]*\s*\||\s*[^|]+\s*\|)))/

/**
 * Normalize AI quirks: CRLF, trailing spaces, indented block syntax, blank lines around tables.
 */
export function normalizeMarkdown(content: string): string {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trimEnd()
    const block = line.match(BLOCK_LINE)
    if (block) {
      const spaces = block[1].length
      if (spaces > 0 && spaces <= MAX_BLOCK_INDENT) {
        line = line.slice(spaces)
      }
    }
    out.push(line)
  }

  return ensureBlankLinesAroundTables(out).join('\n')
}

function ensureBlankLinesAroundTables(lines: string[]): string[] {
  const result: string[] = []
  const isTableRow = (line: string) => /^\s*\|/.test(line.trim())

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const prev = result[result.length - 1]
    const isTable = isTableRow(line)
    const prevIsTable = prev !== undefined && isTableRow(prev)

    if (isTable && prev !== undefined && prev.trim() !== '' && !prevIsTable) {
      result.push('')
    }
    result.push(line)

    const next = lines[i + 1]
    if (isTable && next !== undefined && next.trim() !== '' && !isTableRow(next)) {
      result.push('')
    }
  }

  return result
}
