/** Plain text for TTS — no markdown, emojis, URLs, or source/citation blocks. */

const SOURCES_HEADING =
  /(?:^|\n)\s*(?:#{1,3}\s*)?(?:\*\*)?(?:Sources|References|Citations|Bibliography|Источники|Ссылки|Quellen|Fuentes|Fontes)(?:\*\*)?\s*:?\s*\n?[\s\S]*$/gim

function stripSourcesAndCitations(text: string): string {
  let s = text.replace(SOURCES_HEADING, '')
  s = s.replace(/(?:^|\n)\s*(?:Source|Sources|Reference|Источник|Источники)\s*:\s*[^\n]+/gim, '')
  s = s.replace(/\[\d+\](?:\[\d+\])*/g, '')
  s = s.replace(/\((?:source|источник|quelle)\s*:\s*[^)]+\)/gi, '')
  return s
}

function linkLabelForSpeech(label: string): string {
  const t = label.trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return ''
  if (/^(?:www\.)?[a-z0-9][-a-z0-9]*\.[a-z]{2,}(\/\S*)?$/i.test(t)) return ''
  return t
}

export function stripTextForSpeech(text: string): string {
  let s = stripSourcesAndCitations(text)

  s = s.replace(/\p{Extended_Pictographic}/gu, '')
  s = s.replace(/[\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}\u{200D}\u{FE0F}]/gu, '')

  s = s.replace(/```[\s\S]*?```/g, ' ')
  s = s.replace(/`([^`]+)`/g, '$1')
  s = s.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, (_m, label: string) => linkLabelForSpeech(label))
  s = s.replace(/<https?:\/\/[^>]+>/g, ' ')
  s = s.replace(/https?:\/\/\S+/g, ' ')

  s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
  s = s.replace(/__([^_]+)__/g, '$1')
  s = s.replace(/\*([^*]+)\*/g, '$1')
  s = s.replace(/_([^_]+)_/g, '$1')
  s = s.replace(/~~([^~]+)~~/g, '$1')

  s = s.replace(/^#{1,6}\s+/gm, '')
  s = s.replace(/^>\s?/gm, '')
  s = s.replace(/^[\t ]*[-*+]\s+/gm, '')
  s = s.replace(/^[\t ]*\d+\.\s+/gm, '')
  s = s.replace(/^[-*_]{3,}\s*$/gm, ' ')

  s = s.replace(/[*#_`~|\\[\](){}]/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()

  return s
}
