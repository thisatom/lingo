import { useEffect, useState } from 'react'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import { isAttachmentRef } from '@/entities/message/lib/attachment-payload'
import { resolveAttachmentPayload } from '@/entities/message/lib/prepare-attachment'

export function useAttachmentDisplayUrl(att: MessageAttachment): string {
  const [url, setUrl] = useState(() =>
    isAttachmentRef(att.payload) ? '' : att.payload
  )

  useEffect(() => {
    if (!isAttachmentRef(att.payload)) {
      setUrl(att.payload)
      return
    }

    let cancelled = false
    void resolveAttachmentPayload(att).then((resolved) => {
      if (!cancelled) setUrl(resolved)
    })

    return () => {
      cancelled = true
    }
  }, [att.id, att.payload])

  return url
}
