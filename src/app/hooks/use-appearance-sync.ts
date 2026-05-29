import { useEffect } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { applyAppearancePreference } from '@/shared/lib/appearance'

export function useAppearanceSync(): void {
  const uiFontFamily = useSettingsStore((s) => s.uiFontFamily)
  const uiTextScale = useSettingsStore((s) => s.uiTextScale)
  const chatTextScale = useSettingsStore((s) => s.chatTextScale)
  const codeTextScale = useSettingsStore((s) => s.codeTextScale)
  const thinkingTextScale = useSettingsStore((s) => s.thinkingTextScale)
  const conversationDensity = useSettingsStore((s) => s.conversationDensity)
  const reduceUiMotion = useSettingsStore((s) => s.reduceUiMotion)

  useEffect(() => {
    applyAppearancePreference({
      uiFontFamily,
      uiTextScale,
      chatTextScale,
      codeTextScale,
      thinkingTextScale,
      conversationDensity,
      reduceUiMotion
    })
  }, [
    uiFontFamily,
    uiTextScale,
    chatTextScale,
    codeTextScale,
    thinkingTextScale,
    conversationDensity,
    reduceUiMotion
  ])
}
