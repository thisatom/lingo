/** google-translate-api-x recommends chunks under 5000 characters. */
export const TRANSLATION_CHUNK_MAX = 4500

export function splitTextForTranslation(text: string, maxChars = TRANSLATION_CHUNK_MAX): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (trimmed.length <= maxChars) return [trimmed]

  const chunks: string[] = []
  let rest = trimmed

  while (rest.length > maxChars) {
    let cut = rest.lastIndexOf('\n\n', maxChars)
    if (cut < maxChars * 0.35) cut = rest.lastIndexOf('\n', maxChars)
    if (cut < maxChars * 0.35) cut = rest.lastIndexOf('. ', maxChars)
    if (cut < maxChars * 0.35) cut = rest.lastIndexOf(' ', maxChars)
    if (cut < 200) cut = maxChars

    const piece = rest.slice(0, cut).trim()
    if (piece.length >= 1) chunks.push(piece)
    rest = rest.slice(cut).trimStart()
  }

  if (rest.length > 0) chunks.push(rest)
  return chunks
}
