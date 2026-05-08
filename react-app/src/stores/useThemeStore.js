import { create } from 'zustand'

export const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('mindspace_theme') === 'dark',

  toggle: () => set((state) => {
    const next = !state.isDark
    localStorage.setItem('mindspace_theme', next ? 'dark' : 'light')
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    return { isDark: next }
  }),

  hydrate: () => set((state) => {
    if (state.isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    return state
  }),
}))
