/** Target size for one TTS request — fewer clips, shorter gaps at periods. */
export const SPEECH_CHUNK_MAX_CHARS = 340

/** Prefer merging short sentences until at least this size (unless flushing). */
export const SPEECH_CHUNK_MIN_CHARS = 72

/** Start speaking from a comma clause when buffer grows this large without a sentence end. */
export const SPEECH_CHUNK_COMMA_FLUSH = 140
