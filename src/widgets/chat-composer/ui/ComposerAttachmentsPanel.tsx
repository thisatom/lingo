import type { MessageAttachment } from '@/entities/message/model/attachment'
import {
  AttachmentListPanel,
  type AttachmentListPanelProps
} from '@/features/chat-attachments/ui/AttachmentListPanel'

type Props = Pick<
  AttachmentListPanelProps,
  'items' | 'onRemove' | 'embedded' | 'readOnly' | 'metaSuffix' | 'listId' | 'className'
>

/** Composer attachment list — embedded above the textarea. */
export function ComposerAttachmentsPanel({
  items,
  onRemove,
  embedded = false,
  readOnly = false,
  metaSuffix = 'to message',
  listId = 'composer-attachments-list',
  className
}: Props) {
  return (
    <AttachmentListPanel
      embedded={embedded}
      embeddedDivider="bottom"
      readOnly={readOnly}
      items={items}
      onRemove={onRemove}
      metaSuffix={metaSuffix}
      listId={listId}
      className={className}
    />
  )
}
