/**
 * Bundle Monaco locally for Electron CSP (`script-src 'self'`).
 * Import this module before `@monaco-editor/react` (side effect).
 */
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

loader.config({ monaco })

const global = globalThis as typeof globalThis & {
  MonacoEnvironment?: { getWorker: (workerId: string, label: string) => Worker }
}

global.MonacoEnvironment = {
  getWorker(_workerId, label) {
    if (label === 'json') return new jsonWorker()
    return new editorWorker()
  }
}

/** @deprecated Config runs at import time; kept for call sites. */
export function setupMonacoEnvironment(): void {}
