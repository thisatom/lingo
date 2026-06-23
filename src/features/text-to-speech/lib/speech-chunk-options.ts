/** Target size for one TTS request — fewer clips, shorter gaps at periods. */
export const SPEECH_CHUNK_MAX_CHARS = 320

/** Prefer merging short sentences until at least this size (unless flushing). */
export const SPEECH_CHUNK_MIN_CHARS = 48

/** Start speaking from a comma clause when buffer grows this large without a sentence end. */
export const SPEECH_CHUNK_COMMA_FLUSH = 72

/** First audible chunk — start as soon as a short clause is ready. */
export const SPEECH_CHUNK_FIRST_MIN_CHARS = 18
