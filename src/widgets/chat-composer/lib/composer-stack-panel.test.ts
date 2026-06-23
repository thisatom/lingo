import { describe, expect, it, vi } from 'vitest'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { QueuedMessage } from '@/entities/message-queue/model/store'
import {
  COMPOSER_STACK_PANEL_DEFAULT_COLLAPSED,
  filterAttachmentsByQuery,
  filterQueuedByQuery,
  toggleStackPanelCollapse
} from '@/widgets/chat-composer/lib/composer-stack-panel'

describe('composer stack panel filters', () => {
  it('filters attachments by file name', () => {
    const items: MessageAttachment[] = [
      { id: '1', kind: 'text', name: 'notes.txt', mimeType: 'text/plain', text: 'a' },
      { id: '2', kind: 'text', name: 'readme.md', mimeType: 'text/plain', text: 'b' }
    ]
    expect(filterAttachmentsByQuery(items, 'readme')).toHaveLength(1)
    expect(filterAttachmentsByQuery(items, '')).toHaveLength(2)
  })

  it('filters queued messages by content and attachment names', () => {
    const items: QueuedMessage[] = [
      { id: '1', content: 'hello world' },
      { id: '2', content: '', attachments: [{ id: 'a1', kind: 'text', name: 'spec.pdf', mimeType: 'application/pdf', text: '' }] }
    ]
    expect(filterQueuedByQuery(items, 'hello')).toHaveLength(1)
    expect(filterQueuedByQuery(items, 'spec')).toHaveLength(1)
  })

  it('defaults stack panels to collapsed', () => {
    expect(COMPOSER_STACK_PANEL_DEFAULT_COLLAPSED).toBe(true)
  })

  it('toggleStackPanelCollapse expands or collapses and clears search on hide', () => {
    let collapsed = true
    const resetSearch = vi.fn()
    toggleStackPanelCollapse(collapsed, (next) => {
      collapsed = next
    }, resetSearch)
    expect(collapsed).toBe(false)
    expect(resetSearch).not.toHaveBeenCalled()

    toggleStackPanelCollapse(collapsed, (next) => {
      collapsed = next
    }, resetSearch)
    expect(collapsed).toBe(true)
    expect(resetSearch).toHaveBeenCalledOnce()
  })
})
