import { describe, expect, it } from 'vitest'
import {
  detectLanguageFromText,
  isPracticeLanguageAuto,
  normalizeTranslationSourceLanguage,
  normalizeTranslationTargetLanguage,
  resolvePracticeLanguage,
  sttLanguageParam
} from './practice-languages'

describe('practice language auto', () => {
  it('detects common scripts', () => {
    expect(detectLanguageFromText('Привет, как дела?')).toBe('ru')
    expect(detectLanguageFromText('Hello, how are you?')).toBe('en')
  })

  it('resolves auto from user text', () => {
    expect(
      resolvePracticeLanguage('auto', { userText: 'Привет, проверка', fallback: 'en' })
    ).toBe('ru')
  })

  it('keeps explicit language codes', () => {
    expect(resolvePracticeLanguage('de', { userText: 'Hello' })).toBe('de')
  })

  it('omits STT language hint in auto mode', () => {
    expect(isPracticeLanguageAuto('auto')).toBe(true)
    expect(sttLanguageParam('auto')).toBeUndefined()
    expect(sttLanguageParam('ru')).toBe('ru')
  })

  it('normalizes translation defaults', () => {
    expect(normalizeTranslationSourceLanguage('auto')).toBe('auto')
    expect(normalizeTranslationSourceLanguage('ru')).toBe('ru')
    expect(normalizeTranslationSourceLanguage('bogus')).toBe('auto')
    expect(normalizeTranslationTargetLanguage('de')).toBe('de')
    expect(normalizeTranslationTargetLanguage('auto')).toBe('en')
  })
})
