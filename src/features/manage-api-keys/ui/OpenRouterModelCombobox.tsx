import { Check, ChevronsUpDown, Trash2 } from '@/shared/ui/icons'
import { useEffect, useMemo, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { normalizeOpenRouterModelId, openRouterSuggestedModels } from '@/shared/config/openrouter'
import {
  fetchOpenRouterModelCatalog,
  isOpenRouterModelIdShape
} from '@/shared/lib/fetch-openrouter-models'
import { getLingo } from '@/shared/lib/lingo'
import { mergeOpenRouterModelIds } from '@/shared/lib/openrouter-models'
import {
  settingsCommandClass,
  settingsCommandInputClass,
  settingsCommandInputWrapperClass,
  settingsCommandListClass,
  settingsSelectContentClass,
  settingsSelectTriggerClass,
  settingsCommandItemClass
} from '@/shared/lib/settings-control'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

type OpenRouterModelComboboxProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

function filterModels(models: readonly string[], q: string): string[] {
  if (!q) return [...models]
  return models.filter((m) => m.toLowerCase().includes(q))
}

export function OpenRouterModelCombobox({ id, value, onChange, className }: OpenRouterModelComboboxProps) {
  const customModels = useSettingsStore((s) => s.customModels ?? [])
  const addCustomModel = useSettingsStore((s) => s.addCustomModel)
  const removeCustomModel = useSettingsStore((s) => s.removeCustomModel)

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [catalog, setCatalog] = useState<string[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(false)

  const q = search.trim().toLowerCase()
  const normalizedSearch = normalizeOpenRouterModelId(search.trim())

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setCatalogLoading(true)
    setCatalogError(null)

    void (async () => {
      try {
        const apiKey = await getLingo().secrets.get('openrouter')
        if (!apiKey) {
          if (!cancelled) {
            setCatalog([])
            setCatalogError('Add an OpenRouter API key to browse models.')
          }
          return
        }
        const ids = await fetchOpenRouterModelCatalog(apiKey)
        if (!cancelled) setCatalog(ids)
      } catch (error) {
        if (!cancelled) {
          setCatalog([])
          setCatalogError(error instanceof Error ? error.message : 'Could not load models')
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open])

  const savedModels = useMemo(() => filterModels(customModels, q), [customModels, q])

  const suggestedModels = useMemo(() => {
    const savedKeys = new Set(customModels.map((m) => normalizeOpenRouterModelId(m).toLowerCase()))
    const base = openRouterSuggestedModels.filter(
      (m) => !savedKeys.has(normalizeOpenRouterModelId(m).toLowerCase())
    )
    return filterModels(base, q)
  }, [customModels, q])

  const catalogModels = useMemo(() => {
    const savedKeys = new Set(
      [...customModels, ...openRouterSuggestedModels].map((m) =>
        normalizeOpenRouterModelId(m).toLowerCase()
      )
    )
    const base = catalog.filter((m) => !savedKeys.has(normalizeOpenRouterModelId(m).toLowerCase()))
    return filterModels(base, q).slice(0, 40)
  }, [catalog, customModels, q])

  const allKnownKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const m of mergeOpenRouterModelIds(customModels, value)) {
      keys.add(normalizeOpenRouterModelId(m).toLowerCase())
    }
    for (const m of catalog) {
      keys.add(normalizeOpenRouterModelId(m).toLowerCase())
    }
    return keys
  }, [catalog, customModels, value])

  const showUseCustom =
    normalizedSearch.length > 0 &&
    isOpenRouterModelIdShape(normalizedSearch) &&
    !allKnownKeys.has(normalizedSearch.toLowerCase())

  const selectModel = (modelId: string, saveToCustom: boolean) => {
    const id = normalizeOpenRouterModelId(modelId)
    if (!id) return
    onChange(id)
    if (saveToCustom) addCustomModel(id)
    close()
  }

  const close = () => {
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            settingsSelectTriggerClass,
            'w-full min-w-0 justify-between font-normal shadow-none',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left text-xs leading-tight">
            {value || 'Model…'}
          </span>
          <ChevronsUpDown className="ml-1 size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(settingsSelectContentClass, 'w-[var(--radix-popover-trigger-width)] p-0')}
        align="start"
      >
        <Command shouldFilter={false} className={settingsCommandClass}>
          <CommandInput
            placeholder="Search or type model id…"
            value={search}
            onValueChange={setSearch}
            wrapperClassName={settingsCommandInputWrapperClass}
            className={settingsCommandInputClass}
          />
          <CommandList className={settingsCommandListClass}>
            {catalogLoading ? (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">Loading models…</div>
            ) : null}
            {catalogError ? (
              <div className="px-2 py-2 text-center text-xs text-muted-foreground">{catalogError}</div>
            ) : null}

            {savedModels.length === 0 &&
            suggestedModels.length === 0 &&
            catalogModels.length === 0 &&
            !showUseCustom ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No matches.</div>
            ) : null}

            {savedModels.length > 0 ? (
              <CommandGroup heading="Saved models">
                {savedModels.map((m) => (
                  <CommandItem
                    key={`saved-${m}`}
                    value={m}
                    className={cn(settingsCommandItemClass, 'group/saved pr-1')}
                    onSelect={() => selectModel(m, false)}
                  >
                    <Check
                      className={cn(
                        'size-3.5 shrink-0 text-muted-foreground',
                        value === m ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{m}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="size-5 shrink-0 opacity-0 group-hover/saved:opacity-100"
                      aria-label={`Remove ${m} from saved`}
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation()
                        removeCustomModel(m)
                      }}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {suggestedModels.length > 0 ? (
              <CommandGroup heading="Free suggestions">
                {suggestedModels.map((m) => (
                  <CommandItem
                    key={m}
                    value={m}
                    keywords={[m.replace(/\//g, ' ')]}
                    className={settingsCommandItemClass}
                    onSelect={() => selectModel(m, false)}
                  >
                    <Check
                      className={cn(
                        'size-3.5 shrink-0 text-muted-foreground',
                        value === m ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="min-w-0 truncate">{m}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {catalogModels.length > 0 ? (
              <CommandGroup heading="OpenRouter">
                {catalogModels.map((m) => (
                  <CommandItem
                    key={`or-${m}`}
                    value={m}
                    className={settingsCommandItemClass}
                    onSelect={() => selectModel(m, true)}
                  >
                    <Check
                      className={cn(
                        'size-3.5 shrink-0 text-muted-foreground',
                        value === m ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="min-w-0 truncate">{m}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {showUseCustom ? (
              <CommandGroup>
                <CommandItem
                  value={`__use__:${normalizedSearch}`}
                  className={settingsCommandItemClass}
                  onSelect={() => selectModel(normalizedSearch, true)}
                >
                  <span className="truncate">Use &quot;{normalizedSearch}&quot;</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
