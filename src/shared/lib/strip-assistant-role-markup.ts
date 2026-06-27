import {
  stripAssistantDisplayLeaks,
  stripAssistantStreamDisplayLeaks,
  stripInvisibleFormatChars
} from '@/shared/lib/strip-assistant-display-leaks'

/** Role / template delimiters some models leak into visible answer text. */
const ROLE_TAG =
  /<\/?(?:assistant|user|system|tool|think(?:ing)?|redacted_reasoning)\b[^>]*>/gi

const CHATML_TOKEN = /<\|im_(?:start|end)\|>\s*(?:assistant|user|system|tool)?\s*/gi

const CHATML_END = /<\|im_end\|>/gi

/** HTML/formatting tags some models leak into visible text. */
const FORMATTING_TAG =
  /<\/?(?:u|b|i|em|strong|underline|span|div|p|br|font)\b[^>]*>/gi

/** Incomplete tag at end of a streaming buffer — hide until the closing `>` arrives. */
const PARTIAL_TAG_SUFFIX = /<\/?[a-z][a-z0-9-]*(?:\s[^>]*)?$/i

function stripKnownFormattingTags(text: string): string {
  return text.replace(FORMATTING_TAG, '')
}

function stripPartialTagSuffix(text: string): string {
  return text.replace(PARTIAL_TAG_SUFFIX, '')
}

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
  let s = stripAssistantRoleTags(text)
  s = stripKnownFormattingTags(s)
  s = stripPartialTagSuffix(s)
  s = stripAssistantStreamDisplayLeaks(s)
  return s
}

/** Remove chat-template markup and tool/citation leaks from final assistant text. */
export function stripAssistantRoleMarkup(text: string): string {
  return stripAssistantDisplayLeaks(stripKnownFormattingTags(stripAssistantRoleTags(text)))
}
