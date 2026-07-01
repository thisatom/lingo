import { useCallback, useEffect, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { translateMarkdownPreservingStructure } from '@/features/message-translate/lib/translate-markdown'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'

type View = 'original' | 'translated'

export function useReplyTranslation(content: string) {
  const settingsFrom = useSettingsStore((s) => s.translationSourceLanguage)
  const settingsTo = useSettingsStore((s) => s.translationTargetLanguage)
  const setTranslationSourceLanguage = useSettingsStore((s) => s.setTranslationSourceLanguage)
  const setTranslationTargetLanguage = useSettingsStore((s) => s.setTranslationTargetLanguage)

  const [fromLang, setFromLang] = useState(settingsFrom)
  const [toLang, setToLang] = useState(settingsTo)
  const [view, setView] = useState<View>('original')
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFromLang(settingsFrom)
    setToLang(settingsTo)
  }, [settingsFrom, settingsTo])

  useEffect(() => {
    setView('original')
    setTranslatedText(null)
    setError(null)
    setLoading(false)
  }, [content])

  useEffect(() => {
    setTranslatedText(null)
    setView('original')
  }, [fromLang, toLang])

  const isShowingTranslation = view === 'translated' && translatedText != null
  const displayContent = isShowingTranslation ? translatedText : content

  const translate = useCallback(async () => {
    if (!content.trim()) return

    if (!isLingoAvailable() || !getLingo().translate?.text || !getLingo().translate?.texts) {
      setError('Translation is unavailable.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const translateApi = getLingo().translate!
      const translated = await translateMarkdownPreservingStructure(content, async (texts) => {
        if (texts.length === 0) return []
        const result = await translateApi.texts({
          texts,
          from: fromLang,
          to: toLang
        })
        return result.texts
      })
      setTranslatedText(translated)
      setView('translated')
      setTranslationSourceLanguage(fromLang)
      setTranslationTargetLanguage(toLang)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Translation failed'
      setError(
        msg.includes('TRANSLATE_FAILED') || msg.includes('TRANSLATE_')
          ? 'Could not translate this reply. Check your connection and try again.'
          : msg
      )
    } finally {
      setLoading(false)
    }
  }, [
    content,
    fromLang,
    toLang,
    setTranslationSourceLanguage,
    setTranslationTargetLanguage
  ])

  const toggle = useCallback(async () => {
    if (isShowingTranslation) {
      setView('original')
      setError(null)
      return
    }
    if (translatedText) {
      setView('translated')
      setError(null)
      return
    }
    await translate()
  }, [isShowingTranslation, translate, translatedText])

  const updateFromLang = useCallback((value: string) => {
    setFromLang(value)
  }, [])

  const updateToLang = useCallback((value: string) => {
    setToLang(value)
  }, [])

  return {
    displayContent,
    isShowingTranslation,
    loading,
    error,
    toggle,
    fromLang,
    toLang,
    updateFromLang,
    updateToLang
  }
}
