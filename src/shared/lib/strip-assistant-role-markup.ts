import {
  stripAssistantDisplayLeaks,
  stripInvisibleFormatChars
} from '@/shared/lib/strip-assistant-display-leaks'

/** Role / template delimiters some models leak into visible answer text. */
const ROLE_TAG =
  /<\/?(?:assistant|user|system|tool|think(?:ing)?|redacted_reasoning)\b[^>]*>/gi

const CHATML_TOKEN = /<\|im_(?:start|end)\|>\s*(?:assistant|user|system|tool)?\s*/gi

const CHATML_END = /<\|im_end\|>/gi

function stripAssistantRoleTags(text: string): string {
  if (!text) return text

  let s = text
    .replace(ROLE_TAG, '')
    .replace(CHATML_TOKEN, '')
    .replace(CHATML_END, '')

  return s.replace(/^\s*<\/?[a-z][\w-]*\s*>\s*$/gim, '')
}

/**
 * Safe while SSE chunks are still arriving — role tags + invisible chars only.
 * Do not run line-based citation cleanup on partial text (it eats split words).
 */
export function stripAssistantStreamSafeMarkup(text: string): string {
  return stripInvisibleFormatChars(stripAssistantRoleTags(text))
}

/** Remove chat-template markup and tool/citation leaks from final assistant text. */
export function stripAssistantRoleMarkup(text: string): string {
  return stripAssistantDisplayLeaks(stripAssistantRoleTags(text))
}
