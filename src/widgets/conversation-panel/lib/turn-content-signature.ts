import type { ConversationTurn } from '@/widgets/conversation-panel/lib/group-turns'

/** Fingerprint for virtualizer remeasure when turn bodies grow without id changes. */
export function buildTurnContentSignature(turn: ConversationTurn): string {
  const attachments = turn.user.attachments?.length ?? 0
  const assistant = turn.assistantMessages
    .map(
      (message) =>
        `${message.id}:${message.role}:${message.content.length}:${
          message.replyStatus ?? ''
        }:${message.searchSources?.length ?? 0}`
    )
    .join('|')
  return `${turn.user.content.length}:a${attachments}:${assistant}`
}

export function buildTurnsContentSignature(turns: readonly ConversationTurn[]): string {
  return turns.map(buildTurnContentSignature).join('||')
}
