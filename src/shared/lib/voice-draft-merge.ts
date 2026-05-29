/** Merge existing draft prefix with cumulative STT transcript (browser sends full phrase). */
export function mergePrefixAndSpoken(prefix: string, spoken: string): string {
  const base = prefix.trimEnd()
  const transcript = spoken.trim()
  if (!base) return transcript
  if (!transcript) return base.trim()
  if (transcript.startsWith(base) || transcript.startsWith(base.trim())) return transcript
  const baseTrimmed = base.trim()
  if (baseTrimmed.endsWith(transcript)) return baseTrimmed
  return `${base}${/\s$/.test(base) ? '' : ' '}${transcript}`.trim()
}
