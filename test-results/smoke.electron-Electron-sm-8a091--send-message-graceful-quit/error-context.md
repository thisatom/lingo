# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.electron.spec.ts >> Electron smoke >> main window, send message, graceful quit
- Location: e2e\smoke.electron.spec.ts:15:3

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator: locator('[data-testid="chat-send"]')
Expected: enabled
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeEnabled" with timeout 15000ms
  - waiting for locator('[data-testid="chat-send"]')
    8 × locator resolved to <button disabled type="button" data-size="iconSm" data-state="closed" data-variant="default" data-testid="chat-send" aria-label="Send message" data-slot="tooltip-trigger" class="inline-flex cursor-pointer items-center justify-center gap-2 text-sm font-medium whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-d…>…</button>
      - unexpected value "disabled"

```

```yaml
- region "Notifications alt+T"
- list:
  - button "Back"
  - link "User":
    - /url: "#/settings/user"
  - link "Devices":
    - /url: "#/settings/devices"
  - link "Speech":
    - /url: "#/settings/speech"
  - link "Practice":
    - /url: "#/settings/practice"
  - link "API":
    - /url: "#/settings/api"
- paragraph: User
- link "Settings":
  - /url: "#/"
- separator
- main:
  - heading "API" [level=2]
  - paragraph: Chat backend
  - text: Mode
  - paragraph: Any OpenAI-compatible API (Ollama, LM Studio, vLLM, OpenAI, …).
  - combobox "Mode": Custom endpoint
  - paragraph: Completion
  - text: Max response tokens
  - paragraph: "Upper bound for each assistant reply (`max_tokens` in the API). Does not change the model context window — only how long a single answer may be."
  - combobox "Max response tokens": 16 384 — long replies
  - paragraph: Model
  - paragraph:
    - text: JSON (
    - code: baseURL
    - text: ","
    - code: model
    - text: ","
    - code: completion
    - text: ) or paste an axios / NVIDIA / OpenAI SDK snippet — URL, model, and
    - code: Bearer
    - text: key are applied automatically (key is not stored in JSON).
  - button "Import snippet"
  - button "Reset template"
  - code:
    - textbox "Editor content"
  - paragraph: Profile imported — paste the API key into Custom endpoint key below.
  - paragraph: API keys
  - paragraph: Custom endpoint API key
  - paragraph: "Desktop API unavailable. Run: npm run dev"
  - textbox "Optional for local servers"
  - button "Other providers Optional keys for speech and other integrations.":
    - paragraph: Other providers
    - paragraph: Optional keys for speech and other integrations.
- alert
- alert
```

# Test source

```ts
  1  | /**
  2  |  * Electron smoke: launch → main UI → send message (E2E mock stream) → quit.
  3  |  *
  4  |  * Requires: `npm run build` then `npm run test:e2e`
  5  |  * Uses `LINGO_E2E=1` (isolated userData, skip welcome, mock `lingo:chat:stream`).
  6  |  */
  7  | import path from 'node:path'
  8  | import { fileURLToPath } from 'node:url'
  9  | import { test, expect, _electron as electron } from '@playwright/test'
  10 | 
  11 | const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
  12 | const mainEntry = path.join(repoRoot, 'out', 'main', 'index.js')
  13 | 
  14 | test.describe('Electron smoke', () => {
  15 |   test('main window, send message, graceful quit', async () => {
  16 |     const app = await electron.launch({
  17 |       args: [mainEntry],
  18 |       cwd: repoRoot,
  19 |       env: {
  20 |         ...process.env,
  21 |         LINGO_E2E: '1',
  22 |         NODE_ENV: 'test'
  23 |       }
  24 |     })
  25 | 
  26 |     try {
  27 |       const window = await app.firstWindow({ timeout: 90_000 })
  28 |       const input = window.locator('[data-testid="chat-composer-input"]')
  29 |       await expect(input).toBeEnabled({ timeout: 90_000 })
  30 | 
  31 |       const message = `e2e-smoke-${Date.now()}`
  32 |       await input.click()
  33 |       await window.keyboard.type(message, { delay: 5 })
  34 | 
  35 |       const send = window.locator('[data-testid="chat-send"]')
> 36 |       await expect(send).toBeEnabled({ timeout: 15_000 })
     |                          ^ Error: expect(locator).toBeEnabled() failed
  37 |       await send.click()
  38 | 
  39 |       await expect(window.getByText(message)).toBeVisible({ timeout: 30_000 })
  40 |       await expect(window.getByText(`E2E: ${message}`)).toBeVisible({ timeout: 30_000 })
  41 |     } finally {
  42 |       await app.close()
  43 |     }
  44 |   })
  45 | })
  46 | 
```