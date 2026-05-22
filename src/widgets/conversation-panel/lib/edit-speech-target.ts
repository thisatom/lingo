/** Active user-message edit field receiving voice transcript (not the composer). */
export type EditSpeechTarget = {
  messageId: string
  setText: (text: string) => void
  getPrefix: () => string
}
