import { useEffect, useState } from 'react'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { isAttachmentRef } from '@/entities/message/lib/attachment-payload'
import { resolveAttachmentPayload } from '@/entities/message/lib/prepare-attachment'

export function useAttachmentTextContent(attachment: MessageAttachment | null): {
  content: string
  loading: boolean
} {
  const [content, setContent] = useState(() => {
    if (!attachment || attachment.kind !== 'text') return ''
    return isAttachmentRef(attachment.payload) ? '' : attachment.payload
  })
  const [loading, setLoading] = useState(
    () =>
      Boolean(
        attachment?.kind === 'text' && attachment.payload && isAttachmentRef(attachment.payload)
      )
  )

  useEffect(() => {
    if (!attachment || attachment.kind !== 'text') {
      setContent('')
      setLoading(false)
      return
    }

    if (!isAttachmentRef(attachment.payload)) {
      setContent(attachment.payload)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    void resolveAttachmentPayload(attachment).then((resolved) => {
      if (!cancelled) {
        setContent(resolved)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [attachment?.id, attachment?.kind, attachment?.payload])

  return { content, loading }
}
