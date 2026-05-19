/** Plain text for TTS — no markdown syntax or emojis. */
export function stripTextForSpeech(text: string): string {
  let s = text

  s = s.replace(/\p{Extended_Pictographic}/gu, '')
  s = s.replace(/[\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}\u{200D}\u{FE0F}]/gu, '')

  s = s.replace(/```[\s\S]*?```/g, ' ')
  s = s.replace(/`([^`]+)`/g, '$1')
  s = s.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
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
