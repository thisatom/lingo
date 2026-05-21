export type TtsSpeechRate = 'slow' | 'normal' | 'fast'

export const TTS_SPEECH_RATE_OPTIONS: {
  value: TtsSpeechRate
  label: string
  description: string
}[] = [
  {
    value: 'slow',
    label: 'Slower',
    description: 'Clearer pacing, longer pauses between phrases.'
  },
  {
    value: 'normal',
    label: 'Normal',
    description: 'Balanced speed for conversation practice.'
  },
  {
    value: 'fast',
    label: 'Faster',
    description: 'Quicker replies with shorter gaps at punctuation.'
  }
]

const RATE_PRESET_OFFSET: Record<TtsSpeechRate, number> = {
  slow: -14,
  normal: 0,
  fast: 14
}

/** Base conversational rate per language (percent) before user preset. */
const LOCALE_BASE_RATE_PERCENT: Record<string, number> = {
  en: 10,
  de: 8,
  es: 8,
  fr: 8,
  it: 8,
  pt: 8,
  ru: 6,
  ja: 5,
  zh: 5,
  ko: 5,
  pl: 8,
  nl: 8,
  tr: 8
}

export function isTtsSpeechRate(value: unknown): value is TtsSpeechRate {
  return value === 'slow' || value === 'normal' || value === 'fast'
}

export function formatEdgeTtsRate(locale: string | undefined, speechRate: TtsSpeechRate): string {
  const lang = locale?.split('-')[0]?.toLowerCase() ?? 'en'
  const base = LOCALE_BASE_RATE_PERCENT[lang] ?? 8
  const total = Math.max(-45, Math.min(90, base + RATE_PRESET_OFFSET[speechRate]))
  return total >= 0 ? `+${total}%` : `${total}%`
}
