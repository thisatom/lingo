import { Check, ChevronsUpDown, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { normalizeOpenRouterModelId, openRouterSuggestedModels } from '@/shared/config/openrouter'
import { mergeOpenRouterModelIds } from '@/shared/lib/openrouter-models'
import {
  settingsCommandClass,
  settingsCommandInputClass,
  settingsCommandInputWrapperClass,
  settingsCommandListClass,
  settingsPopoverTriggerClass,
  settingsCommandItemClass,
  settingsSelectContentClass
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

  const q = search.trim().toLowerCase()
  const normalizedSearch = normalizeOpenRouterModelId(search.trim())

  const savedModels = useMemo(() => filterModels(customModels, q), [customModels, q])

  const suggestedModels = useMemo(() => {
    const savedKeys = new Set(customModels.map((m) => normalizeOpenRouterModelId(m).toLowerCase()))
    const base = openRouterSuggestedModels.filter(
      (m) => !savedKeys.has(normalizeOpenRouterModelId(m).toLowerCase())
    )
    return filterModels(base, q)
  }, [customModels, q])

  const allKnownKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const m of mergeOpenRouterModelIds(customModels, value)) {
      keys.add(normalizeOpenRouterModelId(m).toLowerCase())
    }
    return keys
  }, [customModels, value])

  const showSaveCustom =
    normalizedSearch.length > 0 && !allKnownKeys.has(normalizedSearch.toLowerCase())

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
          variant="ghost"
          size="xs"
          role="combobox"
          aria-expanded={open}
          className={cn(
            settingsPopoverTriggerClass,
            'w-full justify-start font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {value || 'Choose or type a model id…'}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
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
            {savedModels.length === 0 && suggestedModels.length === 0 && !showSaveCustom ? (
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
              <CommandGroup heading="Suggestions">
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

            {showSaveCustom ? (
              <CommandGroup>
                <CommandItem
                  value={`__save__:${normalizedSearch}`}
                  className={settingsCommandItemClass}
                  onSelect={() => selectModel(normalizedSearch, true)}
                >
                  <span className="truncate">Save &quot;{normalizedSearch}&quot;</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
