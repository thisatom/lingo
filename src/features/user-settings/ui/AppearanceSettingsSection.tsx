import type { ReactNode } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import {
  settingsRowSelectTriggerClass,
  settingsSelectContentClass,
  settingsSelectItemClass
} from '@/shared/lib/settings-control'
import {
  CONVERSATION_DENSITY_OPTIONS,
  TEXT_SCALE_OPTIONS,
  UI_FONT_FAMILY_OPTIONS
} from '@/shared/lib/appearance-options'
import { APP_THEME_OPTIONS } from '@/shared/lib/theme-options'
import {
  settingsCardClass,
  settingsPreviewCardClass,
  settingsRowClass,
  settingsRowDescriptionClass,
  settingsRowTextWrapClass,
  settingsRowTitleClass,
  settingsSubsectionTitleClass
} from '@/shared/lib/settings-surface'
import type { TextScale, UiFontFamily } from '@/shared/lib/appearance'
import type { AppTheme } from '@/shared/types/app-theme'
import { cn } from '@/shared/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'

function AppearanceSelectRow<T extends string>({
  id,
  title,
  description,
  value,
  options,
  onValueChange
}: {
  id: string
  title: string
  description: string
  value: T
  options: { value: T; label: string }[]
  onValueChange: (value: T) => void
}) {
  return (
    <div className={settingsRowClass}>
      <div className={settingsRowTextWrapClass}>
        <p className={settingsRowTitleClass}>{title}</p>
        <p className={settingsRowDescriptionClass}>{description}</p>
      </div>
      <Select value={value} onValueChange={(next) => onValueChange(next as T)}>
        <SelectTrigger id={id} size="sm" className={settingsRowSelectTriggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={settingsSelectItemClass}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function AppearanceSwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
  ariaLabel
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  ariaLabel: string
}) {
  return (
    <div className={settingsRowClass}>
      <div className={settingsRowTextWrapClass}>
        <p className={settingsRowTitleClass}>{title}</p>
        <p className={settingsRowDescriptionClass}>{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={ariaLabel} />
    </div>
  )
}

function AppearancePreview({ children }: { children: ReactNode }) {
  return (
    <>
      <p className={settingsSubsectionTitleClass}>Preview</p>
      <div className={settingsPreviewCardClass}>{children}</div>
    </>
  )
}

export function AppearanceSettingsSection() {
  const appTheme = useSettingsStore((s) => s.appTheme)
  const setAppTheme = useSettingsStore((s) => s.setAppTheme)
  const uiFontFamily = useSettingsStore((s) => s.uiFontFamily)
  const setUiFontFamily = useSettingsStore((s) => s.setUiFontFamily)
  const uiTextScale = useSettingsStore((s) => s.uiTextScale)
  const setUiTextScale = useSettingsStore((s) => s.setUiTextScale)
  const chatTextScale = useSettingsStore((s) => s.chatTextScale)
  const setChatTextScale = useSettingsStore((s) => s.setChatTextScale)
  const codeTextScale = useSettingsStore((s) => s.codeTextScale)
  const setCodeTextScale = useSettingsStore((s) => s.setCodeTextScale)
  const thinkingTextScale = useSettingsStore((s) => s.thinkingTextScale)
  const setThinkingTextScale = useSettingsStore((s) => s.setThinkingTextScale)
  const conversationDensity = useSettingsStore((s) => s.conversationDensity)
  const setConversationDensity = useSettingsStore((s) => s.setConversationDensity)
  const reduceUiMotion = useSettingsStore((s) => s.reduceUiMotion)
  const setReduceUiMotion = useSettingsStore((s) => s.setReduceUiMotion)

  const fontHint =
    UI_FONT_FAMILY_OPTIONS.find((option) => option.value === uiFontFamily)?.hint ?? ''

  return (
    <>
      <p className={settingsSubsectionTitleClass}>Theme</p>
      <div className={settingsCardClass}>
        <AppearanceSelectRow
          id="app-theme"
          title="Color theme"
          description="Light, dark, or follow your system setting."
          value={appTheme}
          options={APP_THEME_OPTIONS}
          onValueChange={(value) => {
            const option = APP_THEME_OPTIONS.find((o) => o.value === value)
            if (option) setAppTheme(option.value as AppTheme)
          }}
        />
      </div>

      <p className={settingsSubsectionTitleClass}>Typography</p>
      <div className={settingsCardClass}>
        <AppearanceSelectRow
          id="ui-font-family"
          title="Interface font"
          description={fontHint}
          value={uiFontFamily}
          options={UI_FONT_FAMILY_OPTIONS}
          onValueChange={(value) => setUiFontFamily(value as UiFontFamily)}
        />
        <AppearanceSelectRow
          id="ui-text-scale"
          title="Interface text size"
          description="Sidebar, settings, menus, and other chrome outside the chat."
          value={uiTextScale}
          options={TEXT_SCALE_OPTIONS}
          onValueChange={(value) => setUiTextScale(value as TextScale)}
        />
        <AppearanceSelectRow
          id="chat-text-scale"
          title="Chat text size"
          description="Message and markdown body text in the conversation."
          value={chatTextScale}
          options={TEXT_SCALE_OPTIONS}
          onValueChange={(value) => setChatTextScale(value as TextScale)}
        />
        <AppearanceSelectRow
          id="code-text-scale"
          title="Code text size"
          description="Inline code and fenced code blocks in assistant replies."
          value={codeTextScale}
          options={TEXT_SCALE_OPTIONS}
          onValueChange={(value) => setCodeTextScale(value as TextScale)}
        />
        <AppearanceSelectRow
          id="thinking-text-scale"
          title="Thinking text size"
          description="Collapsed reasoning blocks above agent replies."
          value={thinkingTextScale}
          options={TEXT_SCALE_OPTIONS}
          onValueChange={(value) => setThinkingTextScale(value as TextScale)}
        />
      </div>

      <p className={settingsSubsectionTitleClass}>Conversation</p>
      <div className={settingsCardClass}>
        <AppearanceSelectRow
          id="conversation-density"
          title="Message spacing"
          description={
            CONVERSATION_DENSITY_OPTIONS.find((o) => o.value === conversationDensity)?.hint ??
            'Vertical space between turns in the chat.'
          }
          value={conversationDensity}
          options={CONVERSATION_DENSITY_OPTIONS}
          onValueChange={(value) => setConversationDensity(value as TextScale)}
        />
      </div>

      <p className={settingsSubsectionTitleClass}>Accessibility</p>
      <div className={settingsCardClass}>
        <AppearanceSwitchRow
          title="Reduce motion"
          description="Shorten UI animations and transitions across the app."
          checked={reduceUiMotion}
          onCheckedChange={(checked) => setReduceUiMotion(Boolean(checked))}
          ariaLabel="Reduce motion"
        />
      </div>

      <AppearancePreview>
        <p className={settingsRowTitleClass}>Chat &amp; code</p>
        <p
          className={cn(
            settingsRowDescriptionClass,
            'mt-1 text-[length:var(--lingo-chat-font-size)] leading-[var(--lingo-chat-line-height)] text-foreground'
          )}
        >
          Sample chat line and{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-[length:var(--lingo-code-font-size)] leading-[var(--lingo-code-line-height)]">
            inline code
          </code>
          .
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-[var(--md-code-bg)] p-3 font-mono text-[length:var(--lingo-code-font-size)] leading-[var(--lingo-code-line-height)] text-[var(--md-code-fg)]">
          {`function greet(name: string) {\n  return \`Hello, \${name}\`\n}`}
        </pre>
        <p
          className={cn(
            settingsRowTitleClass,
            'mt-3 text-[length:var(--lingo-thinking-font-size)] leading-[var(--lingo-thinking-line-height)] text-[color:var(--thinking-foreground)]'
          )}
        >
          Thinking preview — reasoning summary line.
        </p>
      </AppearancePreview>
    </>
  )
}
