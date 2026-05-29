import { stripAssistantDisplayLeaks } from '@/shared/lib/strip-assistant-display-leaks'

/** Role / template delimiters some models leak into visible answer text. */
const ROLE_TAG =
  /<\/?(?:assistant|user|system|tool|think(?:ing)?|redacted_reasoning)\b[^>]*>/gi

const CHATML_TOKEN = /<\|im_(?:start|end)\|>\s*(?:assistant|user|system|tool)?\s*/gi

const CHATML_END = /<\|im_end\|>/gi

/** Remove chat-template markup from assistant-visible text (stream + final). */
export function stripAssistantRoleMarkup(text: string): string {
  if (!text) return text

  let s = text
    .replace(ROLE_TAG, '')
    .replace(CHATML_TOKEN, '')
    .replace(CHATML_END, '')

  s = s.replace(/^\s*<\/?[a-z][\w-]*\s*>\s*$/gim, '')
  return stripAssistantDisplayLeaks(s)
}
