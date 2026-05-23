import '@/shared/lib/monaco-vite-setup'
import Editor, { type OnMount } from '@monaco-editor/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { getLingo } from '@/shared/lib/lingo'
import {
  defaultCustomLlmProfileJson,
  parseCustomLlmProfileSource,
  stringifyCustomLlmProfile
} from '@/shared/lib/custom-llm-profile'
import { settingsButtonSize } from '@/shared/lib/settings-control'
import { settingsRowDescriptionClass } from '@/shared/lib/settings-surface'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

const AUTOSAVE_MS = 500

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 12,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
  tabSize: 2,
  automaticLayout: true,
  padding: { top: 8, bottom: 8 }
}

export function CustomLlmProfileEditor() {
  const profileJson = useSettingsStore((s) => s.customLlmProfileJson)
  const setCustomLlmProfileJson = useSettingsStore((s) => s.setCustomLlmProfileJson)
  const applyParsedProfile = useSettingsStore((s) => s.applyParsedCustomLlmProfile)

  const [draft, setDraft] = useState(profileJson)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importHint, setImportHint] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  const applyParsed = useCallback(
    async (parsed: ReturnType<typeof parseCustomLlmProfileSource>) => {
      if (!parsed.ok) {
        setParseError(parsed.error)
        return
      }
      applyParsedProfile(parsed.data)
      setParseError(null)
      if (parsed.importedApiKey) {
        try {
          await getLingo().secrets.set('custom-llm', parsed.importedApiKey)
          setImportHint('API key from snippet saved to Custom endpoint key below.')
        } catch {
          setImportHint('Profile imported — paste the API key into Custom endpoint key below.')
        }
      }
    },
    [applyParsedProfile]
  )

  useEffect(() => {
    setDraft(profileJson)
  }, [profileJson])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const scheduleSave = useCallback(
    (next: string) => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        const parsed = parseCustomLlmProfileSource(next)
        if (!parsed.ok) {
          setCustomLlmProfileJson(next)
          setParseError(parsed.error)
          return
        }
        const profileJson = stringifyCustomLlmProfile(parsed.data.profile)
        if (profileJson !== next) {
          setDraft(profileJson)
        }
        setCustomLlmProfileJson(profileJson)
        void applyParsed(parsed)
      }, AUTOSAVE_MS)
    },
    [applyParsed, setCustomLlmProfileJson]
  )

  const handleMount: OnMount = (_editor, monacoApi) => {
    monacoApi.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: true,
      trailingCommas: 'warning'
    })
  }

  const handleImportSnippet = async () => {
    const pasted = window.prompt(
      'Paste JSON, axios (invokeUrl, headers, payload), or OpenAI SDK (baseURL, model):'
    )
    if (!pasted?.trim()) return
    setImportHint(null)
    const parsed = parseCustomLlmProfileSource(pasted)
    if (!parsed.ok) {
      setParseError(parsed.error)
      return
    }
    const profileJson = stringifyCustomLlmProfile(parsed.data.profile)
    setDraft(profileJson)
    scheduleSave(pasted)
  }

  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className={cn(settingsRowDescriptionClass, 'mt-0')}>
          JSON (<code className="text-[11px]">baseURL</code>, <code className="text-[11px]">model</code>,{' '}
          <code className="text-[11px]">completion</code>) or paste an axios / NVIDIA / OpenAI SDK
          snippet — URL, model, and <code className="text-[11px]">Bearer</code> key are applied
          automatically (key is not stored in JSON).
        </p>
        <div className="flex shrink-0 gap-1.5">
          <Button
            type="button"
            variant="outline"
            size={settingsButtonSize}
            className="h-7 text-xs"
            onClick={handleImportSnippet}
          >
            Import snippet
          </Button>
          <Button
            type="button"
            variant="outline"
            size={settingsButtonSize}
            className="h-7 text-xs"
            onClick={() => {
              const next = defaultCustomLlmProfileJson()
              setDraft(next)
              scheduleSave(next)
            }}
          >
            Reset template
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'overflow-hidden rounded-md border border-border dark:border-[#373737]',
          parseError && 'border-destructive/60'
        )}
      >
        <Editor
          height="min(320px, 42vh)"
          defaultLanguage="json"
          theme="vs-dark"
          value={draft}
          onChange={(value) => {
            const next = value ?? ''
            setDraft(next)
            scheduleSave(next)
          }}
          onMount={handleMount}
          options={EDITOR_OPTIONS}
          loading={
            <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
              Loading editor…
            </div>
          }
        />
      </div>

      {parseError ? (
        <p className="mt-2 text-xs text-destructive">{parseError}</p>
      ) : importHint ? (
        <p className="mt-2 text-xs text-muted-foreground">{importHint}</p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Saved when valid. Comments <code className="text-[11px]">// …</code> allowed. Code snippets
          convert to JSON on save.
        </p>
      )}
    </div>
  )
}
