import { useEffect } from 'react'

import { useLocation, useNavigate } from 'react-router-dom'

import { useChatsStore } from '@/entities/chat/model/store'



function isNewChatShortcut(event: KeyboardEvent): boolean {

  if (event.key.toLowerCase() !== 'n') return false

  if (!event.ctrlKey && !event.metaKey) return false

  if (event.altKey || event.shiftKey) return false

  return true

}



/** Ctrl+N (Cmd+N on macOS) — create a new chat and open the main view. */

export function useNewChatHotkey(): void {

  const navigate = useNavigate()

  const { pathname } = useLocation()

  const createChat = useChatsStore((s) => s.createChat)



  useEffect(() => {

    const run = () => {

      createChat()

      if (pathname.startsWith('/settings')) {

        navigate('/')

      }

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

  }, [createChat, navigate, pathname])

}

