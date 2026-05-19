import { createContext, useContext } from 'react'

interface ResizableSidebarContextValue {
  sidebarCollapsed: boolean
  toggleSidebarPanel: () => void
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
