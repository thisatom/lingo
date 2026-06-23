export const PRACTICE_LANGUAGE_AUTO = 'auto'

export const PRACTICE_LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: PRACTICE_LANGUAGE_AUTO, label: 'Auto — match your language' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ko', label: 'Korean' },
  { value: 'nl', label: 'Dutch' },
  { value: 'pl', label: 'Polish' },
  { value: 'tr', label: 'Turkish' },
  { value: 'sv', label: 'Swedish' },
  { value: 'uk', label: 'Ukrainian' }
]

export function isPracticeLanguageAuto(language: string | undefined): boolean {
  return language?.trim().toLowerCase() === PRACTICE_LANGUAGE_AUTO
}

/** Language hint for Whisper — omit when settings use Auto. */
export function sttLanguageParam(practiceLanguage: string): string | undefined {
  if (isPracticeLanguageAuto(practiceLanguage)) return undefined
  const lang = practiceLanguage.trim().split('-')[0]?.toLowerCase()
  return lang || undefined
}

const CYRILLIC = /\p{Script=Cyrillic}/u
const HANGUL = /\p{Script=Hangul}/u
const KANA = /[\u3040-\u309F\u30A0-\u30FF]/u
const HAN = /\p{Script=Han}/u

/** Lightweight script heuristic for Auto model language. */
export function detectLanguageFromText(text: string): string | null {
  const sample = text.trim().slice(0, 2000)
  if (!sample) return null

  let cyrillic = 0
  let hangul = 0
  let kana = 0
  let han = 0
  let latin = 0

  for (const ch of sample) {
    if (CYRILLIC.test(ch)) cyrillic++
    else if (HANGUL.test(ch)) hangul++
    else if (KANA.test(ch)) kana++
    else if (HAN.test(ch)) han++
    else if (/[\p{L}]/u.test(ch)) latin++
  }

  const total = cyrillic + hangul + kana + han + latin
  if (total === 0) return null
  if (hangul / total >= 0.25) return 'ko'
  if (kana / total >= 0.08) return 'ja'
  if (cyrillic / total >= 0.25) return 'ru'
  if (han / total >= 0.15) return 'zh'
  if (latin / total >= 0.6) return 'en'
  return null
}

export function resolvePracticeLanguage(
  stored: string,
  options: { userText?: string; assistantText?: string; fallback?: string } = {}
): string {
  if (!isPracticeLanguageAuto(stored)) {
    return stored.trim().split('-')[0]?.toLowerCase() || 'en'
  }

  const fromAssistant = detectLanguageFromText(options.assistantText ?? '')
  if (fromAssistant) return fromAssistant

  const fromUser = detectLanguageFromText(options.userText ?? '')
  if (fromUser) return fromUser

  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.split('-')[0]?.toLowerCase() || 'en'
  }

  return options.fallback ?? 'en'
}

export function practiceLanguageOptionsForSelect(current: string): typeof PRACTICE_LANGUAGE_OPTIONS {
  if (current && !PRACTICE_LANGUAGE_OPTIONS.some((o) => o.value === current)) {
    return [{ value: current, label: `${current} (current)` }, ...PRACTICE_LANGUAGE_OPTIONS]
  }
  return PRACTICE_LANGUAGE_OPTIONS
}

const TRANSLATION_TARGET_OPTIONS = PRACTICE_LANGUAGE_OPTIONS.filter(
  (option) => option.value !== PRACTICE_LANGUAGE_AUTO
)

export function translationTargetOptionsForSelect(current: string): typeof TRANSLATION_TARGET_OPTIONS {
  if (current && !TRANSLATION_TARGET_OPTIONS.some((o) => o.value === current)) {
    return [{ value: current, label: `${current} (current)` }, ...TRANSLATION_TARGET_OPTIONS]
  }
  return TRANSLATION_TARGET_OPTIONS
}

export function normalizeTranslationSourceLanguage(value: unknown): string {
  if (typeof value === 'string' && value.trim()) {
    const code = value.trim().toLowerCase()
    if (isPracticeLanguageAuto(code)) return PRACTICE_LANGUAGE_AUTO
    if (TRANSLATION_TARGET_OPTIONS.some((option) => option.value === code)) return code
  }
  return PRACTICE_LANGUAGE_AUTO
}

export function normalizeTranslationTargetLanguage(value: unknown): string {
  if (typeof value === 'string' && value.trim()) {
    const code = value.trim().toLowerCase()
    if (!isPracticeLanguageAuto(code) && TRANSLATION_TARGET_OPTIONS.some((option) => option.value === code)) {
      return code
    }
  }
  return 'en'
}
