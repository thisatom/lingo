import { useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { settingsButtonSize, settingsInputClass } from '@/shared/lib/settings-control'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup } from '@/shared/ui/item'
import { Label } from '@/shared/ui/label'
import { useOpenRouterKey } from '../model/useOpenRouterKey'

export function OpenRouterKeyForm() {
  const { status, loading, apiError, save, clear, validate } = useOpenRouterKey()
  const modelId = useSettingsStore((s) => s.modelId)
  const setModelId = useSettingsStore((s) => s.setModelId)
  const [value, setValue] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSave = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await save(value)
      setValue('')
      setMessage('Key saved.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save key.')
    } finally {
      setBusy(false)
    }
  }

  const onValidate = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const result = await validate()
      setMessage(result.ok ? 'Key works.' : result.error ?? 'Validation failed.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Validation failed.')
    } finally {
      setBusy(false)
    }
  }

  const onClear = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await clear()
      setMessage('Key removed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ItemGroup className="gap-4">
      {apiError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {apiError}
        </p>
      )}

      <Item size="sm" className="flex-col items-stretch rounded-lg border border-border p-3">
        <ItemContent className="gap-1.5">
          <Label htmlFor="openrouter-key" className="text-xs font-medium">
            OpenRouter API key
          </Label>
          <Input
            id="openrouter-key"
            type="password"
            className={settingsInputClass}
            placeholder="sk-or-…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
          />
          {status?.isSet && (
            <ItemDescription className="text-xs">
              Current: {status.masked ?? 'configured'}
            </ItemDescription>
          )}
        </ItemContent>
        <ItemActions className="mt-3 w-full flex-wrap">
          <Button size={settingsButtonSize} onClick={() => void onSave()} disabled={busy || !value.trim()}>
            Save
          </Button>
          <Button
            size={settingsButtonSize}
            variant="outline"
            onClick={() => void onValidate()}
            disabled={busy || loading}
          >
            Test
          </Button>
          <Button
            size={settingsButtonSize}
            variant="destructive"
            onClick={() => void onClear()}
            disabled={busy || !status?.isSet}
          >
            Clear
          </Button>
        </ItemActions>
      </Item>

      <Item size="sm" className="flex-col items-stretch rounded-lg border border-border p-3">
        <ItemContent className="gap-1.5">
          <Label htmlFor="model" className="text-xs font-medium">
            OpenRouter model
          </Label>
          <Input
            id="model"
            className={settingsInputClass}
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            placeholder="openai/gpt-4o-mini"
          />
          <ItemDescription className="text-xs">
            Model id from OpenRouter, e.g. openai/gpt-4o-mini
          </ItemDescription>
        </ItemContent>
      </Item>

      {message && <ItemDescription className="px-1 text-xs">{message}</ItemDescription>}
    </ItemGroup>
  )
}
