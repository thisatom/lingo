/** Whether MainPage's flush effect may start the next queued user turn. */
export function shouldAutoFlushMessageQueue(input: {
  chatId: string | null | undefined
  agentBusy: boolean
  queueLength: number
  deferTurn: boolean
}): boolean {
  if (!input.chatId) return false
  if (input.deferTurn) return false
  if (input.agentBusy) return false
  if (input.queueLength <= 0) return false
  return true
}
