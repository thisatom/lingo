import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatsStore } from '@/entities/chat/model/store'
import { chatRoutePath } from '@/features/chat/lib/chat-route'
import { isNewChatShortcut } from '@/shared/lib/keyboard-shortcut'

/** Ctrl+N (Cmd+N on macOS) — create a new chat and open the main view. */
export function useNewChatHotkey(): void {
  const navigate = useNavigate()
  const createChat = useChatsStore((s) => s.createChat)

  useEffect(() => {
    const run = () => {
      const id = createChat()
      navigate(chatRoutePath(id))
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isNewChatShortcut(event)) return
      event.preventDefault()
      event.stopPropagation()
      run()
    }

    window.addEventListener('keydown', onKeyDown, true)
    const offNative = (
      window as Window & {
        lingo?: { shortcuts?: { onNewChat: (h: () => void) => () => void } }
      }
    ).lingo?.shortcuts?.onNewChat(run)

    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      offNative?.()
    }
  }, [createChat, navigate])
}
