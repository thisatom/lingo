import type { Monaco } from '@monaco-editor/react'

export const ATTACHMENT_PREVIEW_MONACO_THEME = 'lingo-attachment-preview'

function readCssColor(variable: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  return value || fallback
}

export function defineAttachmentPreviewMonacoTheme(monaco: Monaco, isDark: boolean): void {
  const background = readCssColor('--background', isDark ? '#121212' : '#f5f5f5')
  const foreground = readCssColor('--foreground', isDark ? '#e4e4e4' : '#171717')
  const muted = readCssColor('--muted', isDark ? '#1f1f1f' : '#f0f0f0')
  const border = readCssColor('--border', isDark ? '#242424' : '#d6d6d6')

  monaco.editor.defineTheme(ATTACHMENT_PREVIEW_MONACO_THEME, {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': background,
      'editor.foreground': foreground,
      'editorGutter.background': background,
      'editorLineNumber.foreground': isDark ? '#6b6b6b' : '#737373',
      'editorLineNumber.activeForeground': foreground,
      'editor.selectionBackground': isDark ? '#264f78' : '#add6ff',
      'editor.inactiveSelectionBackground': isDark ? '#3a3d41' : '#e5ebf1',
      'editorWidget.background': background,
      'editorWidget.border': border,
      'scrollbarSlider.background': isDark ? '#ffffff18' : '#00000018',
      'scrollbarSlider.hoverBackground': isDark ? '#ffffff30' : '#00000030',
      'minimap.background': background,
      focusBorder: border,
      'panel.background': muted
    }
  })
}
