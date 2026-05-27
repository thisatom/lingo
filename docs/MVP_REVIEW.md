# MVP — глобальный code review

Дата: **2026-05-22**  
Область: десктоп Electron + web dev, чат, persistence, welcome/onboarding, API keys, custom LLM, голос/TTS.  
Статус: **открытые проблемы MVP** (не закрыты в коде — только зафиксированы).

Как читать:

| Приоритет | Смысл |
|-----------|--------|
| **P0** | Безопасность или потеря данных; чинить до релиза |
| **P1** | Заметные баги/регрессии UX |
| **P2** | Техдолг, краевые случаи, документация |
| **P3** | Улучшения, не блокируют MVP |

---

## P0 — безопасность

### 1. SSRF из main process по запросу renderer — **исправлено (2026-05-22)**

**Было:** Renderer передавал произвольный URL / custom `baseUrl` в IPC.

**Сделано:**
- `src/shared/lib/outbound-url-policy.ts` — блок private/localhost/metadata; `fetchWithOutboundPolicy` с проверкой редиректов.
- `electron/main/link-preview.ts` — только публичные URL.
- `electron/main/sanitize-chat-stream-request.ts` — custom LLM маршрутизация из `localStorage` settings в main; localhost разрешён только для user-configured endpoint.
- `src/shared/lib/openrouter-chat-stream.ts` — валидация custom URL (web path).
- Тесты: `outbound-url-policy.test.ts`, `sanitize-chat-stream-request.test.ts`.

---

### 2. Полный API key в renderer (Electron) — **исправлено (2026-05-22)**

**Было:** `lingo:secrets:get` / reveal в Settings.

**Сделано:**
- Удалены `lingo:secrets:get`, `readKey`/`get` из Electron preload.
- `SecretKeyRow` — замена ключа только вводом нового значения (без чтения сохранённого).
- Каталог моделей OpenRouter — `lingo:openrouter:listModels` в main (`openrouter-models.ts`).
- Web (`dev:web`) по-прежнему использует `readKey` + localStorage (dev-only).

---

### 3. Web-сборка: ключи в `localStorage` — **смягчено (2026-05-22)**

**Ограничение:** Web preview по-прежнему хранит ключи в `localStorage` (не keytar).

**Сделано:**
- `WebDevSecretsNotice` в Settings → API (только `VITE_LINGO_PLATFORM=web`).
- Комментарий в `web-secrets.ts`; `clearAllWebSecrets` включает `custom-llm`.
- README / MVP: явно dev-only.

**Post-MVP:** не использовать `build:web` с реальными секретами; опционально отключить ввод ключей в web prod build.

---

### 4. `sandbox: false` в BrowserWindow — **исправлено (2026-05-22)**

**Сделано:** `sandbox: true` в `window-manager.ts` и `welcome-window.ts` (`contextIsolation: true`, `nodeIntegration: false` без изменений). keytar остаётся в main; preload — только `contextBridge` + titlebar.

**Проверить вручную:** titlebar, welcome, key save, chat stream после `npm run dev`.

---

## P1 — баги и регрессии

### 5. Welcome при ошибке чтения `localStorage` — **исправлено (2026-05-22)**

**Сделано:** Fail-closed — при ошибке `executeJavaScript`, parse settings/chats или неверной форме payload → main, не welcome; `console.warn` / `console.error`. `parseWelcomePersistPayload` + `evaluateWelcomeNeeded`.

**Тесты:** `needs-welcome-window.test.ts` (parse fail-closed, first-run, completed).

---

### 6. Второй экземпляр / новое окно — **исправлено (2026-05-22)**

**Сделано:**
- `setupSingleInstanceApp(focusMainWindow)` — второй экземпляр фокусирует существующее main.
- `focusMainWindow()` в `welcome-flow.ts` — единая точка фокуса / перезапуска.
- Ctrl/Cmd+N и Ctrl/Cmd+Shift+N → только `lingo:shortcut:new-chat` (без нового `BrowserWindow`).

---

### 7. Проверка welcome до Zustand migrate — **исправлено (2026-05-22)**

**Сделано:** `normalizeStoredSettingsForWelcome` — для `version < 13` считает `onboardingCompleted: true` (как migrate v13 в settings store). Используется в `needsWelcomeWindow` до решения о welcome.

**Тесты:** `normalizeStoredSettingsForWelcome` + parse/evaluate в `needs-welcome-window.test.ts`.

---

### 8. Два UI онбординга — **исправлено (2026-05-22)**

**Сделано:** `OnboardingGate` не рендерится в Electron — онбординг только через welcome-окно. Web по-прежнему использует `OnboardingDialog`.

---

### 9. `onboardingCompleted: false` при наличии чатов — **исправлено (2026-05-22)**

**Сделано:** `resolveOnboardingCompleted` + migrate v20 + merge settings — при наличии чатов в `lingo-chats-v3` флаг считается `true`. Settings persist version → 20.

**Тесты:** `onboarding-status.test.ts`.

---

### 10. Graceful shutdown timeout — **смягчено (2026-05-22)**

**Сделано:** `SHUTDOWN_TIMEOUT_MS` 12s → 22s; `AppShutdownSaver` — одна повторная попытка persist при ошибке + лог.

**Post-MVP:** диалог «выйти без сохранения» при повторном сбое.

---

### 11. Welcome без flush настроек — **исправлено (2026-05-22)**

**Сделано:** `flushSettingsPersist()` в `completeOnboarding`, `finishWelcomeWindow`, `beforeunload` на welcome-странице.

---

### 12. Миграция v19 и keychain — **исправлено (2026-05-22)**

**Сделано:** При migrate v19, если в JSON был встроенный `apiKey` (`importedApiKey`), профиль очищается и на desktop вызывается `secrets.clear('custom-llm')` — ключ нужно заново ввести в поле Settings (не в JSON).

---

## P2 — техдолг и качество

### 13. IPC без валидации payload

**Где:** `electron/main/ipc.ts` — `ChatStreamRequest`, `SttTranscribeRequest`, `TtsSynthesizeRequest`, `url` для link preview.

**Проблема:** Нет zod/типовой проверки на границе; некорректный payload → непредсказуемые ошибки или лишние запросы.

**Рекомендация:** Shared zod-схемы в `shared/types` + validate в main.

**Статус:** ✅ `src/shared/types/ipc-schemas.ts`, валидация в `electron/main/ipc.ts`.

**Тесты:** ✅ `ipc-schemas.test.ts`.

---

### 14. `lingo:welcome:finish` без привязки к sender

**Где:** `electron/main/welcome-flow.ts`.

**Проблема:** Любой `webContents` с preload может закрыть welcome и показать main (низкий риск при одном origin).

**Рекомендация:** Проверять `event.sender` === welcome window.

**Статус:** ✅ `isWelcomeSender` в `welcome-flow.ts`.

**Тесты:** нет (ручная проверка).

---

### 15. Скрытый main грузит полное приложение при welcome

**Где:** `welcome-flow.ts` — main создаётся скрытым и грузит `index.html` до решения про welcome.

**Проблема:** Лишняя память/CPU на первом запуске; возможны побочные эффекты (hydrate, фоновые запросы).

**Рекомендация:** Лёгкий preload-страница в main только для чтения `localStorage`, или чтение storage из main без полного React.

**Статус:** ✅ `welcome-probe.html` + `readWelcomeNeededFromProbe()`; main с `deferLoad` до конца welcome.

**Тесты:** нет.

---

### 16. CSP и dev-предупреждения Electron

**Где:** `index.html`, `welcome.html` — строгий CSP; dev — Vite HMR → `unsafe-eval` warning.

**Проблема:** В dev консоль шумит; в prod CSP для `connect-src` широкий (Google Speech и др.).

**Рекомендация:** Разные CSP dev/prod; сузить `connect-src` под фактические endpoints.

**Статус:** ✅ `content-security-policy.ts` + `vite/inject-csp.ts` (dev: `unsafe-eval`, localhost HMR; electron prod без OpenRouter в renderer).

**Тесты:** ✅ `content-security-policy.test.ts`.

---

### 17. `clearAllWebSecrets` не очищает `custom-llm`

**Где:** `src/shared/api/web-secrets.ts` — список провайдеров без `custom-llm`.

**Проблема:** «Очистить всё» на web оставляет custom key.

**Рекомендация:** Добавить `custom-llm` в список.

**Статус:** ✅ `SECRET_PROVIDER_IDS` + `clearAllWebSecrets` перебирает все провайдеры.

**Тесты:** ✅ `web-secrets.test.ts`.

---

### 18. Документация расходится с кодом

**Где:** `AGENTS.md` («исходный код ещё не реализован»), `docs/ARCHITECTURE.md` («будущая сборка не реализована»).

**Проблема:** Вводит в заблуждение агентов и разработчиков.

**Рекомендация:** Обновить AGENTS.md и ARCHITECTURE.md под текущий electron-vite scaffold.

**Статус:** ✅ AGENTS.md и ARCHITECTURE.md обновлены.

**Тесты:** n/a

---

## P3 — улучшения MVP+

### 19. Нет E2E / smoke Electron

Нет Playwright/Spectron smoke: старт → welcome skip → send message → shutdown save.

### 20. Покрытие тестами неравномерное

**Есть (хорошо):** scroll restore/follow, persist flush, completion-quality, custom-llm-profile, chat-persist shutdown, pipeline-stage.

**Нет:** welcome-flow, read-welcome-needed, electron ipc, secrets, link-preview SSRF guards, settings migrate v16–v19, integration ai-chat stream.

### 21. Web vs Electron parity

| Функция | Electron | Web |
|---------|----------|-----|
| Secrets | keytar | localStorage |
| TTS | edge-tts main | ограничено / stub |
| STT Whisper local | main | иначе |
| Chat stream | main proxy | renderer fetch |
| Welcome window | да | нет (OnboardingGate) |

### 22. Ранее исправленные (не открывать повторно)

Зафиксировано в коде; при регрессии проверить:

- Welcome URL: `loadURL` vs `loadFile` (`electron/main/welcome-window.ts`)
- Shutdown до debounce chat persist (`persist-app-state.ts`, `chat-persist-storage.shutdown.test.ts`)
- Welcome только при `needsWelcomeWindow` (`welcome-flow.ts`)

---

## Матрица: проблема → файлы → тесты

| ID | Приоритет | Файлы | Автотесты |
|----|-----------|-------|-----------|
| 1 | P0 | `outbound-url-policy.ts`, `sanitize-chat-stream-request.ts`, `link-preview.ts` | ✅ |
| 2 | P0 | `ipc.ts`, `preload`, `SecretKeyRow.tsx`, `openrouter-models.ts` | ✅ |
| 3 | P0 | `WebDevSecretsNotice.tsx`, `web-secrets.ts` | ⚠️ dev-only |
| 4 | P0 | `window-manager.ts`, `welcome-window.ts` | ✅ |
| 5 | P1 | `read-welcome-needed.ts`, `needs-welcome-window.ts` | ✅ |
| 6 | P1 | `welcome-flow.ts`, `window-manager.ts`, `window-shortcuts.ts` | ✅ |
| 7 | P1 | `normalizeStoredSettingsForWelcome` | ✅ |
| 8 | P1 | `OnboardingGate.tsx` | ✅ |
| 9 | P1 | `onboarding-status.ts`, settings v20 | ✅ |
| 10 | P1 | `shutdown.ts`, `AppShutdownSaver.tsx` | ⚠️ retry |
| 11 | P1 | `flush-settings-persist.ts`, welcome | ✅ |
| 12 | P1 | settings migrate v19 | ✅ |
| 13 | P2 | `ipc-schemas.ts`, `ipc.ts` | ✅ |
| 14 | P2 | `welcome-flow.ts` | ⚠️ manual |
| 15 | P2 | `welcome-probe.ts`, `welcome-flow.ts` | ❌ |
| 16 | P2 | `content-security-policy.ts`, `vite/inject-csp.ts` | ✅ |
| 17 | P2 | `secret-providers.ts`, `web-secrets.ts` | ✅ |
| 18 | P2 | `AGENTS.md`, `docs/ARCHITECTURE.md` | n/a |

---

## Agent stability (чат)

**Статус:** в работе (фаза 0–1 по [CHAT_AGENT_STABILITY_PLAN.md](./CHAT_AGENT_STABILITY_PLAN.md)).

| ID | Приоритет | Задача | Статус |
|----|-----------|--------|--------|
| AG-1 | P1 | Контракт поведения | ✅ `docs/CHAT_AGENT.md` |
| AG-2 | P1 | Ручной QA чеклист | ✅ `docs/CHAT_AGENT_MANUAL_QA.md` |
| AG-3 | P0 | Vitest: Stop / session / queue / stream done | ✅ `chat-agent-{policies,stream-turn,stop}.test.ts` |
| AG-4 | P1 | Выделить `ChatAgentController`, упростить `useAiChat` | 🔄 фаза 2 (runTurn в controller) |
| AG-5 | P2 | Playwright smoke (send + stop) | ⏳ фаза 4 |

**DoD:** сценарии из `CHAT_AGENT.md` + зелёный `npm test` + обязательные пункты `CHAT_AGENT_MANUAL_QA.md`.

---

## Рекомендуемый порядок исправлений (post-review)

1. P0 SSRF guards (link preview + custom LLM URL policy)  
2. P1 second-instance / new window → single window policy  
3. P1 welcome fail-closed + migrate alignment  
4. P1 onboarding UX consolidation (welcome **или** dialog)  
5. P0/P2 sandbox + IPC validation (пакетом)  
6. P2 docs sync (`AGENTS.md`, `ARCHITECTURE.md`)  
7. P3 E2E smoke + тесты welcome/shutdown  

---

## Связанные документы

- [README.md](../README.md) — запуск и обзор продукта  
- [API_KEYS.md](./API_KEYS.md) — модель ключей  
- [ARCHITECTURE.md](./ARCHITECTURE.md) — процессы (требует обновления)  
- [SPEECH_PIPELINE.md](./SPEECH_PIPELINE.md) — STT/TTS
- [CHAT_AGENT_STABILITY_PLAN.md](./CHAT_AGENT_STABILITY_PLAN.md) — план стабилизации агента чата (DoD, фазы, тесты)  

*Этот файл — живой backlog MVP review. При исправлении пункта — помечать в PR ссылкой на ID (например `MVP-6`).*
