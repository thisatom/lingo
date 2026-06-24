import { useMemo } from 'react'
import { useSettingsStore, type ChatComposerMode } from '@/entities/settings/model/store'
import { practiceLanguageOptionsForSelect, translationTargetOptionsForSelect } from '@/shared/config/practice-languages'
import {
  settingsSelectContentClass,
  settingsSelectItemClass,
  settingsSelectTriggerClass
} from '@/shared/lib/settings-control'
import { LLM_MAX_TOKENS_PRESETS, llmMaxTokensSelectValue } from '@/shared/lib/llm-max-tokens'
import { cn } from '@/shared/lib/utils'
import {
  settingsCardClass,
  settingsRowClass,
  settingsRowDescriptionClass,
  settingsRowTextWrapClass,
  settingsRowTitleClass,
  settingsSectionTitleClass,
  settingsSubsectionTitleClass
} from '@/shared/lib/settings-surface'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { CHAT_MODE_LABELS } from '@/widgets/chat-composer/lib/composer-toolbar'

const COMPOSER_MODE_OPTIONS: { value: ChatComposerMode; label: string }[] = [
  { value: 'text', label: CHAT_MODE_LABELS.text },
  { value: 'conversation', label: CHAT_MODE_LABELS.conversation }
]

export function AgentSettingsForm() {
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const setPracticeLanguage = useSettingsStore((s) => s.setPracticeLanguage)
  const addressUserByName = useSettingsStore((s) => s.addressUserByName)
  const setAddressUserByName = useSettingsStore((s) => s.setAddressUserByName)
  const chatComposerMode = useSettingsStore((s) => s.chatComposerMode)
  const setChatComposerMode = useSettingsStore((s) => s.setChatComposerMode)
  const webSearchEnabled = useSettingsStore((s) => s.webSearchEnabled)
  const setWebSearchEnabled = useSettingsStore((s) => s.setWebSearchEnabled)
  const llmBackend = useSettingsStore((s) => s.llmBackend)
  const modelAutoFallback = useSettingsStore((s) => s.modelAutoFallback)
  const setModelAutoFallback = useSettingsStore((s) => s.setModelAutoFallback)
  const llmMaxTokens = useSettingsStore((s) => s.llmMaxTokens)
  const setLlmMaxTokens = useSettingsStore((s) => s.setLlmMaxTokens)
  const checkpointReturnConfirmEnabled = useSettingsStore((s) => s.checkpointReturnConfirmEnabled)
  const setCheckpointReturnConfirmEnabled = useSettingsStore(
    (s) => s.setCheckpointReturnConfirmEnabled
  )
  const translationSourceLanguage = useSettingsStore((s) => s.translationSourceLanguage)
  const translationTargetLanguage = useSettingsStore((s) => s.translationTargetLanguage)
  const setTranslationSourceLanguage = useSettingsStore((s) => s.setTranslationSourceLanguage)
  const setTranslationTargetLanguage = useSettingsStore((s) => s.setTranslationTargetLanguage)

  const languageOptions = useMemo(
    () => practiceLanguageOptionsForSelect(practiceLanguage),
    [practiceLanguage]
  )

  const translationSourceOptions = useMemo(
    () => practiceLanguageOptionsForSelect(translationSourceLanguage),
    [translationSourceLanguage]
  )
  const translationTargetOptions = useMemo(
    () => translationTargetOptionsForSelect(translationTargetLanguage),
    [translationTargetLanguage]
  )

  return (
    <section>
      <h2 className={settingsSectionTitleClass}>Agent</h2>

      <p className={settingsSubsectionTitleClass}>Model</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Model language</p>
            <p className={settingsRowDescriptionClass}>
              Language for assistant replies and speech recognition. Auto follows the language you
              speak or type.
            </p>
          </div>
          <Select value={practiceLanguage} onValueChange={setPracticeLanguage}>
            <SelectTrigger
              id="model-language"
              size="sm"
              className={`${settingsSelectTriggerClass} w-[220px] min-w-0`}
            >
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
              {languageOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className={settingsSelectItemClass}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <Label htmlFor="llm-max-tokens" className={settingsRowTitleClass}>
              Max response tokens
            </Label>
            <p className={settingsRowDescriptionClass}>
              Upper bound for each assistant reply. “No limit” uses the provider default.
            </p>
          </div>
          <Select
            value={llmMaxTokensSelectValue(llmMaxTokens)}
            onValueChange={(value) => setLlmMaxTokens(Number(value))}
          >
            <SelectTrigger
              id="llm-max-tokens"
              size="sm"
              className={cn(settingsSelectTriggerClass, 'w-[280px] min-w-0')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className={settingsSelectContentClass}>
              {LLM_MAX_TOKENS_PRESETS.map((preset) => (
                <SelectItem
                  key={preset.value}
                  value={String(preset.value)}
                  className={settingsSelectItemClass}
                >
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className={settingsSubsectionTitleClass}>Personalization</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Address me by name</p>
            <p className={settingsRowDescriptionClass}>
              Adds a hidden instruction so the assistant uses your display name from General.
            </p>
          </div>
          <Switch
            checked={addressUserByName}
            onCheckedChange={(checked) => setAddressUserByName(Boolean(checked))}
            aria-label="Address me by name"
          />
        </div>
      </div>

      <p className={settingsSubsectionTitleClass}>Tools</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Web search</p>
            <p className={settingsRowDescriptionClass}>
              Allow the agent to search the web for factual or current questions when you ask.
              Also toggled in the composer.
            </p>
          </div>
          <Switch
            checked={webSearchEnabled}
            onCheckedChange={(checked) => setWebSearchEnabled(Boolean(checked))}
            aria-label="Web search"
          />
        </div>
        {llmBackend === 'openrouter' ? (
          <div className={settingsRowClass}>
            <div className={settingsRowTextWrapClass}>
              <p className={settingsRowTitleClass}>Auto model fallback</p>
              <p className={settingsRowDescriptionClass}>
                On API errors, try other free OpenRouter models once each.
              </p>
            </div>
            <Switch
              checked={modelAutoFallback}
              onCheckedChange={(checked) => setModelAutoFallback(Boolean(checked))}
              aria-label="Auto model fallback"
            />
          </div>
        ) : null}
      </div>

      <p className={settingsSubsectionTitleClass}>Conversation</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Default input mode</p>
            <p className={settingsRowDescriptionClass}>
              Starting mode for the composer: typed messages or live Agent Speech.
            </p>
          </div>
          <Select
            value={chatComposerMode}
            onValueChange={(value) => setChatComposerMode(value as ChatComposerMode)}
          >
            <SelectTrigger
              id="chat-composer-mode"
              size="sm"
              className={`${settingsSelectTriggerClass} w-[220px] min-w-0`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
              {COMPOSER_MODE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className={settingsSelectItemClass}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className={settingsSubsectionTitleClass}>Translation</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Default source language</p>
            <p className={settingsRowDescriptionClass}>
              Used when you translate an assistant reply from the message toolbar. Auto detects
              the reply language.
            </p>
          </div>
          <Select
            value={translationSourceLanguage}
            onValueChange={setTranslationSourceLanguage}
          >
            <SelectTrigger
              id="translation-source-language"
              size="sm"
              className={`${settingsSelectTriggerClass} w-[220px] min-w-0`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
              {translationSourceOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className={settingsSelectItemClass}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Default target language</p>
            <p className={settingsRowDescriptionClass}>
              Where replies are translated to when you use the translate button on a message.
            </p>
          </div>
          <Select
            value={translationTargetLanguage}
            onValueChange={setTranslationTargetLanguage}
          >
            <SelectTrigger
              id="translation-target-language"
              size="sm"
              className={`${settingsSelectTriggerClass} w-[220px] min-w-0`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
              {translationTargetOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className={settingsSelectItemClass}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className={settingsSubsectionTitleClass}>Messages &amp; editing</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Confirm before return to checkpoint</p>
            <p className={settingsRowDescriptionClass}>
              Show a confirmation dialog before submitting an edit that removes later messages.
            </p>
          </div>
          <Switch
            checked={checkpointReturnConfirmEnabled}
            onCheckedChange={(checked) => setCheckpointReturnConfirmEnabled(Boolean(checked))}
            aria-label="Confirm before return to checkpoint"
          />
        </div>
      </div>
    </section>
  )
}
