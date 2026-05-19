# electron/main

Entry main process. Здесь создаётся окно и подключается `@incanta/custom-electron-titlebar`.

На этапе разработки здесь же запускается **edge-tts**; аудио отдаётся в renderer по IPC.

**Секреты:** OpenRouter и др. ключи — `safeStorage` + IPC `lingo:secrets:*`. См. `docs/API_KEYS.md`, `docs/STACK.md`.

Renderer не импортирует этот код.
