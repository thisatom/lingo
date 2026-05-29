export type UiFontFamily = 'system' | 'serif' | 'monospace'

export type TextScale = 'compact' | 'default' | 'comfortable'

export type ConversationDensity = TextScale

const UI_FONT_FAMILIES: UiFontFamily[] = ['system', 'serif', 'monospace']
const TEXT_SCALES: TextScale[] = ['compact', 'default', 'comfortable']

export function isUiFontFamily(value: unknown): value is UiFontFamily {
  return typeof value === 'string' && UI_FONT_FAMILIES.includes(value as UiFontFamily)
}

export function isTextScale(value: unknown): value is TextScale {
  return typeof value === 'string' && TEXT_SCALES.includes(value as TextScale)
}

export function isConversationDensity(value: unknown): value is ConversationDensity {
  return isTextScale(value)
}

const FONT_SANS_STACK: Record<UiFontFamily, string> = {
  system:
    "-apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', Times, serif",
  monospace:
    "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, Menlo, Monaco, 'Cascadia Mono', 'Courier New', monospace"
}

const CHAT_TEXT_SCALE: Record<TextScale, { fontSize: string; lineHeight: string }> = {
  compact: { fontSize: '12px', lineHeight: '1.5' },
  default: { fontSize: '13px', lineHeight: '1.55' },
  comfortable: { fontSize: '14px', lineHeight: '1.6' }
}

const CODE_TEXT_SCALE: Record<TextScale, { fontSize: string; lineHeight: string }> = {
  compact: { fontSize: '11px', lineHeight: '1.5' },
  default: { fontSize: '12px', lineHeight: '1.55' },
  comfortable: { fontSize: '13px', lineHeight: '1.6' }
}

const THINKING_TEXT_SCALE: Record<TextScale, { fontSize: string; lineHeight: string }> = {
  compact: { fontSize: '12px', lineHeight: '1.45' },
  default: { fontSize: '13px', lineHeight: '1.5' },
  comfortable: { fontSize: '14px', lineHeight: '1.55' }
}

/** Only non-default scales touch `html` — default keeps the pre-appearance browser/Tailwind base (~16px). */
const UI_ROOT_FONT_SIZE: Partial<Record<TextScale, string>> = {
  compact: '12px',
  comfortable: '14px'
}

export const CONVERSATION_DENSITY_GAP_CLASS: Record<ConversationDensity, string> = {
  compact: 'space-y-3',
  default: 'space-y-5',
  comfortable: 'space-y-7'
}

export type AppearancePreferences = {
  uiFontFamily: UiFontFamily
  uiTextScale: TextScale
  chatTextScale: TextScale
  codeTextScale: TextScale
  thinkingTextScale: TextScale
  conversationDensity: ConversationDensity
  reduceUiMotion: boolean
}

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  uiFontFamily: 'system',
  uiTextScale: 'default',
  chatTextScale: 'default',
  codeTextScale: 'default',
  thinkingTextScale: 'default',
  conversationDensity: 'default',
  reduceUiMotion: false
}

export function applyAppearancePreference(preferences: AppearancePreferences): void {
  const root = document.documentElement
  const chat = CHAT_TEXT_SCALE[preferences.chatTextScale] ?? CHAT_TEXT_SCALE.default
  const code = CODE_TEXT_SCALE[preferences.codeTextScale] ?? CODE_TEXT_SCALE.default
  const thinking =
    THINKING_TEXT_SCALE[preferences.thinkingTextScale] ?? THINKING_TEXT_SCALE.default
  root.style.setProperty('--font-sans', FONT_SANS_STACK[preferences.uiFontFamily])
  const uiRootFontSize = UI_ROOT_FONT_SIZE[preferences.uiTextScale]
  if (uiRootFontSize) {
    root.style.fontSize = uiRootFontSize
  } else {
    root.style.removeProperty('font-size')
  }
  root.style.setProperty('--lingo-chat-font-size', chat.fontSize)
  root.style.setProperty('--lingo-chat-line-height', chat.lineHeight)
  root.style.setProperty('--lingo-code-font-size', code.fontSize)
  root.style.setProperty('--lingo-code-line-height', code.lineHeight)
  root.style.setProperty('--lingo-thinking-font-size', thinking.fontSize)
  root.style.setProperty('--lingo-thinking-line-height', thinking.lineHeight)
  root.dataset.uiFont = preferences.uiFontFamily
  root.dataset.uiTextScale = preferences.uiTextScale
  root.dataset.chatTextScale = preferences.chatTextScale
  root.dataset.codeTextScale = preferences.codeTextScale
  root.dataset.thinkingTextScale = preferences.thinkingTextScale
  root.dataset.conversationDensity = preferences.conversationDensity
  root.classList.toggle('lingo-reduce-motion', preferences.reduceUiMotion)
}
