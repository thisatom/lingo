import type { SettingsSection, SettingsSectionId } from '@/entities/settings/config/sections'
import { SETTINGS_SECTIONS } from '@/entities/settings/config/sections'

const SETTINGS_SECTION_META: Record<
  SettingsSectionId,
  { description: string; keywords: readonly string[] }
> = {
  general: {
    description: 'Profile, display name, and defaults',
    keywords: ['profile', 'name', 'user', 'account', 'language']
  },
  shortcuts: {
    description: 'Keyboard shortcuts and hotkeys',
    keywords: ['keyboard', 'hotkey', 'shortcut', 'ctrl', 'keybinding']
  },
  appearance: {
    description: 'Theme, density, and visual preferences',
    keywords: ['theme', 'dark', 'light', 'density', 'ui', 'color']
  },
  devices: {
    description: 'Microphone and audio input',
    keywords: ['microphone', 'mic', 'audio', 'input', 'device']
  },
  speech: {
    description: 'Text-to-speech and voice output',
    keywords: ['tts', 'voice', 'speak', 'azure', 'edge']
  },
  agent: {
    description: 'AI model, prompts, and web search',
    keywords: ['model', 'llm', 'openrouter', 'prompt', 'search', 'agent']
  },
  api: {
    description: 'API keys and provider endpoints',
    keywords: ['key', 'token', 'openrouter', 'endpoint', 'secret']
  }
}

export type SettingsSearchEntry = SettingsSection & {
  description: string
  keywords: readonly string[]
}

export const SETTINGS_SEARCH_ENTRIES: SettingsSearchEntry[] = SETTINGS_SECTIONS.map((section) => ({
  ...section,
  ...SETTINGS_SECTION_META[section.id]
}))

export function filterSettingsSections(query: string): SettingsSearchEntry[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return SETTINGS_SEARCH_ENTRIES

  return SETTINGS_SEARCH_ENTRIES.filter((section) => {
    const haystack = [section.label, section.description, section.id, ...section.keywords]
      .join(' ')
      .toLowerCase()
    return haystack.includes(trimmed)
  })
}
