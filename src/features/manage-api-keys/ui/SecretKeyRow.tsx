import { Eye, EyeOff } from '@/shared/ui/icons'
import { useEffect, useRef, useState } from 'react'
import { getLingo } from '@/shared/lib/lingo'
import { isMaskedSecretDisplay } from '@/shared/lib/secret-mask'
import { settingsInputClass } from '@/shared/lib/settings-control'
import {
  settingsRowClass,
  settingsRowDescriptionClass,
  settingsRowTextWrapClass,
  settingsRowTitleClass
} from '@/shared/lib/settings-surface'
import { Input } from '@/shared/ui/input'
import type { SecretProviderId, SecretStatus } from '@/shared/types/ipc'
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
  const statusRef = useRef(status)
  const editingRef = useRef(editingNewKey)

  statusRef.current = status
  editingRef.current = editingNewKey

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
    if (editingRef.current) return

    const masked = status.masked ?? '••••••••'
    if (prevMaskedRef.current !== masked) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      prevMaskedRef.current = masked
      setValue(masked)
    }
  }, [status, onMessage])

  const id = `api-key-${providerId}`

  const applySavedStatus = (saved: SecretStatus) => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setEditingNewKey(false)
    setShowSecret(false)
    const masked = saved.masked ?? '••••••••'
    prevMaskedRef.current = masked
    setValue(masked)
  }

  const schedule = (next: string) => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(async () => {
      onMessage(null)
      const trimmed = next.trim()
      const currentStatus = statusRef.current
      const masked = currentStatus?.masked ?? '••••••••'

      if (isMaskedSecretDisplay(trimmed)) {
        if (currentStatus?.isSet && trimmed === masked) return
        return
      }

      try {
        if (trimmed.length === 0) {
          if (currentStatus?.isSet) {
            const cleared = await clear()
            applySavedStatus(cleared)
            onMessage('Key removed.')
          }
          setTestMessage(null)
          return
        }

        const saved = await save(trimmed)
        applySavedStatus(saved)

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

  const beginReplaceKey = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setEditingNewKey(true)
    setShowSecret(false)
    setValue('')
    setTestMessage(null)
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
                ? 'Configured. Click the field and paste a new key to replace.'
                : 'Not configured.'}
        </p>
      </div>
      <div className="relative w-[260px] min-w-0 shrink-0">
        <Input
          id={id}
          className={`${settingsInputClass} w-full pr-10`}
          placeholder={placeholder}
          value={value}
          onFocus={() => {
            const masked = status?.masked
            if (status?.isSet && masked && value === masked && !editingNewKey) {
              beginReplaceKey()
            }
          }}
          onChange={(e) => {
            const next = e.target.value
            if (!editingNewKey) setEditingNewKey(true)
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
