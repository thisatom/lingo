const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-BR',
  ru: 'ru-RU',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ko: 'ko-KR',
  pl: 'pl-PL',
  nl: 'nl-NL',
  tr: 'tr-TR',
  ar: 'ar-SA',
  hi: 'hi-IN'
}

/** Maps practice language (ISO) to BCP-47 for Web Speech API. */
export function toSpeechLocale(language: string): string {
  const normalized = language.trim().toLowerCase()
  if (normalized.includes('-')) return normalized
  return LOCALE_MAP[normalized] ?? `${normalized}-${normalized.toUpperCase()}`
}
