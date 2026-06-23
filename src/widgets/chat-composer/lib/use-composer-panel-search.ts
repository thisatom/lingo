import { useCallback, useEffect, useRef, useState } from 'react'

export function useComposerPanelSearch() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setSearchQuery('')
  }, [])

  useEffect(() => {
    if (!searchOpen) return
    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [searchOpen])

  const toggleSearch = useCallback(
    (expandList: () => void) => {
      setSearchOpen((open) => {
        if (open) {
          setSearchQuery('')
          return false
        }
        expandList()
        return true
      })
    },
    []
  )

  return {
    searchOpen,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    toggleSearch,
    resetSearch: closeSearch
  }
}
