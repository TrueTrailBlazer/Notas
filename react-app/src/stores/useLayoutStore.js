import { create } from 'zustand'

export const useLayoutStore = create((set) => ({
  gridSize: localStorage.getItem('mindspace_grid_size') || 'medium',
  sidebarWidth: parseInt(localStorage.getItem('mindspace_sidebar_width') || '280', 10),
  sidebarOpen: false,
  activeView: 'dashboard',
  fixedCollapsed: localStorage.getItem('mindspace_fixed_collapsed') === 'true',
  newCollapsed: localStorage.getItem('mindspace_new_collapsed') === 'true',

  setGridSize: (size) => {
    localStorage.setItem('mindspace_grid_size', size)
    set({ gridSize: size })
  },

  setSidebarWidth: (width) => {
    localStorage.setItem('mindspace_sidebar_width', String(width))
    set({ sidebarWidth: width })
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  setActiveView: (view) => set({ activeView: view }),

  toggleFixedCollapsed: () => set((s) => {
    const next = !s.fixedCollapsed
    localStorage.setItem('mindspace_fixed_collapsed', String(next))
    return { fixedCollapsed: next }
  }),

  toggleNewCollapsed: () => set((s) => {
    const next = !s.newCollapsed
    localStorage.setItem('mindspace_new_collapsed', String(next))
    return { newCollapsed: next }
  }),
}))
