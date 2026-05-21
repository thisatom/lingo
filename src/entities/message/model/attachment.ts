export type MessageAttachmentKind = 'image' | 'text'

export interface MessageAttachment {
  id: string
  kind: MessageAttachmentKind
  name: string
  mimeType: string
  /** data URL for images; plain text for text files */
  payload: string
  sizeBytes: number
}

/** Stable empty reference for Zustand selectors (avoids useSyncExternalStore loops). */
export const EMPTY_COMPOSER_ATTACHMENTS: readonly MessageAttachment[] = []
