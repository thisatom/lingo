import type { MessageAttachment } from '@/entities/message/model/attachment'
import { AttachmentListPanel } from '@/features/chat-attachments/ui/AttachmentListPanel'

/** Read-only attachment panel embedded below user question text (same shell). */
export function UserMessageAttachments({
  attachments,
  messageId
}: {
  attachments: MessageAttachment[]
  messageId: string
}) {
  if (attachments.length === 0) return null

  return (
    <AttachmentListPanel
      embedded
      embeddedDivider="top"
      readOnly
      items={attachments}
      metaSuffix="in message"
      listId={`user-message-attachments-${messageId}`}
    />
  )
}
