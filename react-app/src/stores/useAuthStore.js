import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  session: null,
  user: null,
  loading: true,
  error: null,

  checkSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({
      session,
      user: session?.user || null,
      loading: false,
    })
  },

  login: async (email, password) => {
    set({ error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: 'Credenciais inválidas.' })
      return false
    }
    set({ session: data.session, user: data.session.user, error: null })
    return true
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },

  clearError: () => set({ error: null }),
}))
