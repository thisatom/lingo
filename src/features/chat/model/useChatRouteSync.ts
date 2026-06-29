import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { lingoToast } from '@/shared/ui/lingo-toast'
import { useChatsStore } from '@/entities/chat/model/store'
import { chatRoutePath } from '@/features/chat/lib/chat-route'
import { parseChatIdFromInput } from '@/features/chat/lib/parse-chat-id'

/** Keeps `/#/c/:chatId` and `activeChatId` in sync (both directions). */
export function useChatRouteSync(): void {
  const navigate = useNavigate()
  const location = useLocation()
  const { chatId: routeChatIdRaw } = useParams<{ chatId?: string }>()
  const activeChatId = useChatsStore((s) => s.activeChatId)
  const chats = useChatsStore((s) => s.chats)
  const selectChat = useChatsStore((s) => s.selectChat)
  const reconcileActiveChat = useChatsStore((s) => s.reconcileActiveChat)
  const [hydrated, setHydrated] = useState(() => useChatsStore.persist.hasHydrated())
  const warnedMissingRef = useRef<string | null>(null)
  const syncingFromRouteRef = useRef(false)

  useEffect(() => {
    if (hydrated) return
    return useChatsStore.persist.onFinishHydration(() => setHydrated(true))
  }, [hydrated])

  const routeChatId = routeChatIdRaw
    ? parseChatIdFromInput(decodeURIComponent(routeChatIdRaw)) ??
      decodeURIComponent(routeChatIdRaw)
    : null

  useEffect(() => {
    if (!hydrated || !routeChatId) return

    const exists = chats.some((chat) => chat.id === routeChatId)
    if (exists) {
      warnedMissingRef.current = null
      if (activeChatId !== routeChatId) {
        syncingFromRouteRef.current = true
        selectChat(routeChatId)
      }
      return
    }

    if (warnedMissingRef.current !== routeChatId) {
      warnedMissingRef.current = routeChatId
      lingoToast.error('Chat not found', {
        description: 'This chat is not in your history on this device.'
      })
    }

    const fallbackId = reconcileActiveChat()
    if (fallbackId) {
      navigate(chatRoutePath(fallbackId), { replace: true })
      return
    }

    navigate('/', { replace: true })
  }, [hydrated, routeChatId, chats, activeChatId, selectChat, navigate, reconcileActiveChat])

  useEffect(() => {
    if (!hydrated || !activeChatId) return
    if (syncingFromRouteRef.current) {
      syncingFromRouteRef.current = false
      return
    }
    if (routeChatId === activeChatId) return

    const target = chatRoutePath(activeChatId)
    if (location.pathname !== target) {
      navigate(target)
    }
  }, [hydrated, activeChatId, routeChatId, location.pathname, navigate])
}
