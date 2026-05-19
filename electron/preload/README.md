# electron/preload

Скрипт preload: узкий типизированный API для renderer (`window.lingo`).

Каналы IPC с префиксом `lingo:`.

Секреты: `window.lingo.secrets` — set / getStatus / validate (без возврата полного ключа после save). См. `docs/API_KEYS.md`.
