import { Eye, EyeOff } from '@/shared/ui/icons'
import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { getLingo } from '@/shared/lib/lingo'
import { settingsInputClass } from '@/shared/lib/settings-control'
import {
  settingsCardClass,
  settingsRowClass,
  settingsRowDescriptionClass,
  settingsRowTextWrapClass,
  settingsRowTitleClass,
  settingsSectionTitleClass
} from '@/shared/lib/settings-surface'
import { Input } from '@/shared/ui/input'
import { ItemDescription } from '@/shared/ui/item'
import type { SecretProviderId } from '@/shared/types/ipc'
import { useSecretKey } from '../model/useSecretKey'
import { OpenRouterModelCombobox } from './OpenRouterModelCombobox'

const PROVIDERS: { id: SecretProviderId; label: string; placeholder: string }[] = [
  { id: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-…' },
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-…' },
  { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-…' },
  { id: 'google', label: 'Google', placeholder: 'AIza…' },
  { id: 'groq', label: 'Groq', placeholder: 'gsk_…' },
  { id: 'azure-speech', label: 'Azure Speech', placeholder: '…' }
]

const AUTOSAVE_DELAY_MS = 650

function SecretKeySection({
  providerId,
  label,
  placeholder,
  onMessage
}: {
  providerId: SecretProviderId
  label: string
  placeholder: string
  onMessage: (message: string | null) => void
}) {
  const { status, loading, apiError, save, clear, readKey } = useSecretKey(providerId)
  const [value, setValue] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [testMessage, setTestMessage] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const wasKeySetRef = useRef(false)
  const prevMaskedRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!status) return
    onMessage(null)
    if (!status.isSet) {
      if (wasKeySetRef.current) {
        setValue('')
      }
      wasKeySetRef.current = false
      prevMaskedRef.current = undefined
      setShowSecret(false)
      setRevealed(false)
      setTestMessage(null)
      return
    }

    wasKeySetRef.current = true
    if (revealed) return

    const masked = status.masked ?? '••••••••'
    if (prevMaskedRef.current !== masked) {
      prevMaskedRef.current = masked
      setValue(masked)
    }
  }, [status, onMessage, revealed])

  const id = `api-key-${providerId}`

  const schedule = (next: string) => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(async () => {
      onMessage(null)
      try {
        if (next.trim().length === 0) {
          if (status?.isSet) {
            await clear()
            onMessage('Key removed.')
          }
          setTestMessage(null)
          return
        }
        await save(next)
        if (providerId === 'openrouter') {
          setTestMessage('Checking key...')
          const result = await getLingo().secrets.validateOpenRouter()
          setTestMessage(result.ok ? 'OpenRouter: key is valid.' : result.error ?? 'Validation failed.')
        } else {
          setTestMessage('Saved.')
        }
        onMessage('Saved.')
      } catch (e) {
        setTestMessage(null)
        onMessage(e instanceof Error ? e.message : 'Could not save key.')
      }
    }, AUTOSAVE_DELAY_MS)
  }

  return (
    <div className={settingsRowClass}>
      <div className={settingsRowTextWrapClass}>
        <p className={settingsRowTitleClass}>{label} API key</p>
        <p className={settingsRowDescriptionClass}>
          {apiError
            ? apiError
            : testMessage
              ? testMessage
              : status?.isSet
                ? 'Configured. Clear the field to remove.'
                : 'Not configured.'}
        </p>
      </div>
      <div className="relative w-[260px] min-w-0">
        <Input
          id={id}
          className={`${settingsInputClass} w-full pr-10`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const next = e.target.value
            setValue(next)
            schedule(next)
          }}
          autoComplete="off"
          disabled={loading}
          type={showSecret ? 'text' : 'password'}
        />
        {(status?.isSet || value.trim().length > 0) && (
          <button
            type="button"
            className="absolute top-1/2 right-0.5 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            onClick={async () => {
              if (showSecret) {
                setShowSecret(false)
                setRevealed(false)
                if (status?.isSet) {
                  setValue(status.masked ?? '••••••••')
                }
                return
              }
              if (status?.isSet && !revealed) {
                try {
                  const secret = await readKey()
                  if (secret == null || secret === '') {
                    onMessage('Could not read the saved key.')
                    return
                  }
                  setValue(secret)
                  setRevealed(true)
                } catch (e) {
                  onMessage(e instanceof Error ? e.message : 'Could not read the saved key.')
                  return
                }
              }
              setShowSecret(true)
            }}
            aria-label={showSecret ? 'Hide API key' : 'Show API key'}
          >
            {showSecret ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        )}
      </div>
    </div>
  )
}

export function OpenRouterKeyForm() {
  const modelId = useSettingsStore((s) => s.modelId)
  const setModelId = useSettingsStore((s) => s.setModelId)
  const [message, setMessage] = useState<string | null>(null)

  return (
    <section>
      <h2 className={settingsSectionTitleClass}>API</h2>
      <div className={settingsCardClass}>
        {PROVIDERS.map((p) => (
          <SecretKeySection
            key={p.id}
            providerId={p.id}
            label={p.label}
            placeholder={p.placeholder}
            onMessage={setMessage}
          />
        ))}
      </div>

      <div className={`${settingsCardClass} mt-3`}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>OpenRouter model</p>
            <p className={settingsRowDescriptionClass}>
              Same height as other settings selects. Browse OpenRouter or type any model id
              (e.g. openai/gpt-4o-mini).
            </p>
          </div>
          <OpenRouterModelCombobox
            id="model"
            value={modelId}
            onChange={setModelId}
            className="w-[260px]"
          />
        </div>
      </div>

      {message && <ItemDescription className="mt-2 px-1 text-xs">{message}</ItemDescription>}
    </section>
  )
}
