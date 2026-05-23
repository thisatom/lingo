import { ChevronDown } from '@/shared/ui/icons'
import { lazy, Suspense, useMemo, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import {
  settingsSelectContentClass,
  settingsSelectItemClass,
  settingsSelectTriggerClass
} from '@/shared/lib/settings-control'
import {
  settingsCardClass,
  settingsRowClass,
  settingsRowDescriptionClass,
  settingsRowTextWrapClass,
  settingsRowTitleClass,
  settingsSectionTitleClass,
  settingsSubsectionTitleClass
} from '@/shared/lib/settings-surface'
import { cn } from '@/shared/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/shared/ui/collapsible'
import { ItemDescription } from '@/shared/ui/item'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select'
import { LLM_MAX_TOKENS_PRESETS } from '@/shared/lib/llm-max-tokens'
import type { LlmBackend, SecretProviderId } from '@/shared/types/ipc'
import { OpenRouterModelCombobox } from './OpenRouterModelCombobox'

const CustomLlmProfileEditor = lazy(() =>
  import('./CustomLlmProfileEditor').then((m) => ({ default: m.CustomLlmProfileEditor }))
)
import { SecretKeyRow } from './SecretKeyRow'

const LLM_BACKEND_OPTIONS: { value: LlmBackend; label: string }[] = [
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'custom', label: 'Custom endpoint' }
]

const BACKEND_HINT: Record<LlmBackend, string> = {
  openrouter: 'Cloud models via OpenRouter — free models, web search, auto-fallback.',
  custom: 'Any OpenAI-compatible API (Ollama, LM Studio, vLLM, OpenAI, …).'
}

type ProviderDef = {
  id: SecretProviderId
  label: string
  placeholder: string
}

const ALL_PROVIDERS: ProviderDef[] = [
  { id: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-…' },
  { id: 'custom-llm', label: 'Custom endpoint', placeholder: 'Optional for local servers' },
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-…' },
  { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-…' },
  { id: 'google', label: 'Google', placeholder: 'AIza…' },
  { id: 'groq', label: 'Groq', placeholder: 'gsk_…' },
  { id: 'azure-speech', label: 'Azure Speech', placeholder: '…' }
]

function primaryProviderId(backend: LlmBackend): SecretProviderId {
  return backend === 'custom' ? 'custom-llm' : 'openrouter'
}

export function ApiSettingsForm() {
  const llmBackend = useSettingsStore((s) => s.llmBackend)
  const setLlmBackend = useSettingsStore((s) => s.setLlmBackend)
  const modelId = useSettingsStore((s) => s.modelId)
  const setModelId = useSettingsStore((s) => s.setModelId)
  const llmMaxTokens = useSettingsStore((s) => s.llmMaxTokens)
  const setLlmMaxTokens = useSettingsStore((s) => s.setLlmMaxTokens)
  const [message, setMessage] = useState<string | null>(null)
  const [moreKeysOpen, setMoreKeysOpen] = useState(false)

  const primaryId = primaryProviderId(llmBackend)
  const { primaryProvider, otherProviders } = useMemo(() => {
    const primary = ALL_PROVIDERS.find((p) => p.id === primaryId)!
    const others = ALL_PROVIDERS.filter((p) => p.id !== primaryId)
    return { primaryProvider: primary, otherProviders: others }
  }, [primaryId])

  return (
    <section>
      <h2 className={settingsSectionTitleClass}>API</h2>

      <p className={settingsSubsectionTitleClass}>Chat backend</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <Label htmlFor="llm-backend" className={settingsRowTitleClass}>
              Mode
            </Label>
            <p className={settingsRowDescriptionClass}>{BACKEND_HINT[llmBackend]}</p>
          </div>
          <Select
            value={llmBackend}
            onValueChange={(value) => setLlmBackend(value as LlmBackend)}
          >
            <SelectTrigger
              id="llm-backend"
              size="sm"
              className={cn(settingsSelectTriggerClass, 'w-[220px] min-w-0')}
            >
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent position="popper" className={settingsSelectContentClass}>
              {LLM_BACKEND_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className={settingsSelectItemClass}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className={settingsSubsectionTitleClass}>Completion</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <Label htmlFor="llm-max-tokens" className={settingsRowTitleClass}>
              Max response tokens
            </Label>
            <p className={settingsRowDescriptionClass}>
              Upper bound for each assistant reply (`max_tokens` in the API). Does not change the
              model context window — only how long a single answer may be.
            </p>
          </div>
          <Select
            value={String(llmMaxTokens)}
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

      <p className={settingsSubsectionTitleClass}>Model</p>
      {llmBackend === 'openrouter' ? (
        <div className={settingsCardClass}>
          <div className={settingsRowClass}>
            <div className={settingsRowTextWrapClass}>
              <p className={settingsRowTitleClass}>OpenRouter model</p>
              <p className={settingsRowDescriptionClass}>
                Browse the catalog or type any model id (e.g. openai/gpt-4o-mini).
              </p>
            </div>
            <OpenRouterModelCombobox
              id="model"
              value={modelId}
              onChange={setModelId}
              className="w-[260px] shrink-0"
            />
          </div>
        </div>
      ) : (
        <div className={settingsCardClass}>
          <Suspense
            fallback={
              <div className="flex h-[200px] items-center justify-center px-4 text-xs text-muted-foreground">
                Loading editor…
              </div>
            }
          >
            <CustomLlmProfileEditor />
          </Suspense>
        </div>
      )}

      <p className={settingsSubsectionTitleClass}>API keys</p>
      <div className={settingsCardClass}>
        <SecretKeyRow
          providerId={primaryProvider.id}
          label={`${primaryProvider.label} API key`}
          placeholder={primaryProvider.placeholder}
          onMessage={setMessage}
        />

        <Collapsible open={moreKeysOpen} onOpenChange={setMoreKeysOpen}>
          <CollapsibleTrigger
            className={cn(
              settingsRowClass,
              'w-full cursor-pointer select-none border-0 bg-transparent text-left outline-none',
              'hover:bg-muted/25 dark:hover:bg-[#252525]/40',
              'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'
            )}
          >
            <div className={settingsRowTextWrapClass}>
              <p className={settingsRowTitleClass}>Other providers</p>
              <p className={settingsRowDescriptionClass}>
                Optional keys for speech and other integrations.
              </p>
            </div>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                moreKeysOpen && 'rotate-180'
              )}
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            {otherProviders.map((p) => (
              <SecretKeyRow
                key={p.id}
                providerId={p.id}
                label={`${p.label} API key`}
                placeholder={p.placeholder}
                onMessage={setMessage}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {message ? <ItemDescription className="mt-2 px-1 text-xs">{message}</ItemDescription> : null}
    </section>
  )
}
