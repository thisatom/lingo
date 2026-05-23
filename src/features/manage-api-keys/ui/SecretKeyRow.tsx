import { Eye, EyeOff } from '@/shared/ui/icons'
import { useEffect, useRef, useState } from 'react'
import { getLingo } from '@/shared/lib/lingo'
import { settingsInputClass } from '@/shared/lib/settings-control'
import {
  settingsRowClass,
  settingsRowDescriptionClass,
  settingsRowTextWrapClass,
  settingsRowTitleClass
} from '@/shared/lib/settings-surface'
import { Input } from '@/shared/ui/input'
import type { SecretProviderId } from '@/shared/types/ipc'
import { useSecretKey } from '../model/useSecretKey'

const AUTOSAVE_DELAY_MS = 650

export function SecretKeyRow({
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
  const { status, loading, apiError, save, clear } = useSecretKey(providerId)
  const [value, setValue] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [editingNewKey, setEditingNewKey] = useState(false)
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
      setEditingNewKey(false)
      setTestMessage(null)
      return
    }

    wasKeySetRef.current = true
    if (editingNewKey) return

    const masked = status.masked ?? '••••••••'
    if (prevMaskedRef.current !== masked) {
      prevMaskedRef.current = masked
      setValue(masked)
    }
  }, [status, onMessage, editingNewKey])

  const id = `api-key-${providerId}`

  const schedule = (next: string) => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(async () => {
      onMessage(null)
      const masked = status?.masked ?? '••••••••'
      if (status?.isSet && !editingNewKey && next === masked) return
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
        <p className={settingsRowTitleClass}>{label}</p>
        <p className={settingsRowDescriptionClass}>
          {apiError
            ? apiError
            : testMessage
              ? testMessage
              : status?.isSet
                ? 'Configured. Clear the field to replace or remove.'
                : 'Not configured.'}
        </p>
      </div>
      <div className="relative w-[260px] min-w-0 shrink-0">
        <Input
          id={id}
          className={`${settingsInputClass} w-full pr-10`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const next = e.target.value
            setEditingNewKey(true)
            setValue(next)
            schedule(next)
          }}
          autoComplete="off"
          disabled={loading}
          type={showSecret ? 'text' : 'password'}
        />
        {editingNewKey && value.trim().length > 0 ? (
          <button
            type="button"
            className="absolute top-1/2 right-0.5 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setShowSecret((v) => !v)}
            aria-label={showSecret ? 'Hide typed key' : 'Show typed key'}
          >
            {showSecret ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        ) : null}
      </div>
    </div>
  )
}
