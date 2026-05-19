# Переменные окружения (шаблон)

Скопировать в `.env` в корне при реализации (файл `.env` в git не попадает).

**Для конечного пользователя** ключи задаются в **Настройках** приложения. `.env` — удобство для разработки.

```env
# OpenRouter (AI) — опционально для dev; в prod ключ из Settings
LINGO_OPENROUTER_API_KEY=
LINGO_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
LINGO_OPENROUTER_MODEL=openai/gpt-4o-mini

# Опционально для OpenRouter rankings
# LINGO_APP_URL=http://localhost
# LINGO_APP_NAME=Lingo

# Azure Speech (prod STT/TTS — см. docs/STACK.md)
# AZURE_SPEECH_KEY=
# AZURE_SPEECH_REGION=westeurope

# App
LINGO_DEFAULT_PRACTICE_LANGUAGE=en
```

При первом запуске можно прочитать `.env` в main и предложить импорт в secure storage; сохранённый в UI ключ **важнее** `.env`.
