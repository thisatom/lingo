/** Sentinel for Radix Select — pick voice from practice language automatically. */
export const TTS_VOICE_AUTO = '__auto__'

export interface TtsVoiceOption {
  id: string
  label: string
  /** ISO language codes; omit to show for all languages. */
  locales?: string[]
}

export const DEFAULT_TTS_VOICE_BY_LANG: Record<string, string> = {
  en: 'en-US-EmmaMultilingualNeural',
  de: 'de-DE-KatjaNeural',
  es: 'es-ES-ElviraNeural',
  fr: 'fr-FR-DeniseNeural',
  it: 'it-IT-ElsaNeural',
  pt: 'pt-BR-FranciscaNeural',
  ru: 'ru-RU-SvetlanaNeural',
  ja: 'ja-JP-NanamiNeural',
  zh: 'zh-CN-XiaoxiaoNeural',
  ko: 'ko-KR-SunHiNeural',
  pl: 'pl-PL-ZofiaNeural',
  nl: 'nl-NL-ColetteNeural',
  tr: 'tr-TR-EmelNeural'
}

export const TTS_VOICE_OPTIONS: TtsVoiceOption[] = [
  { id: TTS_VOICE_AUTO, label: 'Automatic' },
  { id: 'en-US-EmmaMultilingualNeural', label: 'Emma (multilingual)', locales: ['en'] },
  { id: 'en-US-AriaNeural', label: 'Aria', locales: ['en'] },
  { id: 'en-US-JennyNeural', label: 'Jenny', locales: ['en'] },
  { id: 'de-DE-KatjaNeural', label: 'Katja', locales: ['de'] },
  { id: 'de-DE-ConradNeural', label: 'Conrad', locales: ['de'] },
  { id: 'es-ES-ElviraNeural', label: 'Elvira', locales: ['es'] },
  { id: 'fr-FR-DeniseNeural', label: 'Denise', locales: ['fr'] },
  { id: 'it-IT-ElsaNeural', label: 'Elsa', locales: ['it'] },
  { id: 'pt-BR-FranciscaNeural', label: 'Francisca', locales: ['pt'] },
  { id: 'ru-RU-SvetlanaNeural', label: 'Svetlana', locales: ['ru'] },
  { id: 'ru-RU-DmitryNeural', label: 'Dmitry', locales: ['ru'] },
  { id: 'ja-JP-NanamiNeural', label: 'Nanami', locales: ['ja'] },
  { id: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao', locales: ['zh'] },
  { id: 'ko-KR-SunHiNeural', label: 'Sun-Hi', locales: ['ko'] },
  { id: 'pl-PL-ZofiaNeural', label: 'Zofia', locales: ['pl'] },
  { id: 'nl-NL-ColetteNeural', label: 'Colette', locales: ['nl'] },
  { id: 'tr-TR-EmelNeural', label: 'Emel', locales: ['tr'] }
]

export function getDefaultVoiceForLanguage(language: string): string {
  const lang = language.trim().toLowerCase().split('-')[0] ?? 'en'
  return DEFAULT_TTS_VOICE_BY_LANG[lang] ?? DEFAULT_TTS_VOICE_BY_LANG.en
}

export function getTtsVoiceOptionsForLanguage(language: string): TtsVoiceOption[] {
  const lang = language.trim().toLowerCase().split('-')[0] ?? 'en'
  return TTS_VOICE_OPTIONS.filter(
    (opt) => !opt.locales || opt.locales.includes(lang) || opt.id === TTS_VOICE_AUTO
  )
}

export function normalizeTtsVoiceId(voiceId: string): string {
  const trimmed = voiceId.trim()
  if (!trimmed || trimmed === TTS_VOICE_AUTO) return TTS_VOICE_AUTO
  return trimmed
}

export function isKnownTtsVoiceId(voiceId: string): boolean {
  const id = normalizeTtsVoiceId(voiceId)
  if (id === TTS_VOICE_AUTO) return true
  return TTS_VOICE_OPTIONS.some((o) => o.id === id)
}
