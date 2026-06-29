import { createContext, useContext } from 'react'

interface ResizableSidebarContextValue {
  sidebarCollapsed: boolean
  /** Current expanded sidebar width in pixels. */
  sidebarWidthPx: number
  /** False on settings routes — sidebar cannot be hidden. */
  sidebarHideEnabled: boolean
  toggleSidebarPanel: () => void
  openChatSearch: () => void
  openSettingsSearch: () => void
}

export const ResizableSidebarContext = createContext<ResizableSidebarContextValue | null>(
  null
)

export function useResizableSidebar(): ResizableSidebarContextValue {
  const value = useContext(ResizableSidebarContext)
  if (!value) {
    throw new Error('useResizableSidebar must be used within ResizableSidebarContext.Provider')
  }
  return value
}
