import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { settingsButtonSize, settingsInputClass } from '@/shared/lib/settings-control'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'
import { Input } from '@/shared/ui/input'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup } from '@/shared/ui/item'
import { Label } from '@/shared/ui/label'
import { useOpenRouterKey } from '../model/useOpenRouterKey'
import { OpenRouterModelCombobox } from './OpenRouterModelCombobox'

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

      <Collapsible defaultOpen className="rounded-lg border border-border">
        <CollapsibleTrigger
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left outline-none',
            'hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring [&[data-state=open]>svg]:rotate-180'
          )}
        >
          <span className="text-xs font-medium text-foreground">OpenRouter API key</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Item size="sm" className="flex-col items-stretch border-t border-border p-3">
            <ItemContent className="gap-1.5">
              <Label htmlFor="openrouter-key" className="text-xs font-medium">
                API key
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
              <Button
                size={settingsButtonSize}
                onClick={() => void onSave()}
                disabled={busy || !value.trim()}
              >
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
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen className="rounded-lg border border-border">
        <CollapsibleTrigger
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left outline-none',
            'hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring [&[data-state=open]>svg]:rotate-180'
          )}
        >
          <span className="text-xs font-medium text-foreground">Model</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Item size="sm" className="flex-col items-stretch border-t border-border p-3">
            <ItemContent className="gap-1.5">
              <Label htmlFor="model" className="text-xs font-medium">
                OpenRouter model
              </Label>
              <OpenRouterModelCombobox id="model" value={modelId} onChange={setModelId} />
              <ItemDescription className="text-xs">
                Pick a suggestion or type any OpenRouter model id (e.g. openai/gpt-4o-mini).
              </ItemDescription>
            </ItemContent>
          </Item>
        </CollapsibleContent>
      </Collapsible>

      {message && <ItemDescription className="px-1 text-xs">{message}</ItemDescription>}
    </ItemGroup>
  )
}
