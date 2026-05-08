import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useTasksStore = create((set, get) => ({
  fixed: [],
  new: [],
  loading: false,

  checkDailyReset: async () => {
    const today = new Date().toDateString()
    const lastReset = localStorage.getItem('mindspace_last_reset')
    if (lastReset !== today) {
      await supabase.from('tasks').update({ completed: false }).eq('is_fixed', true)
      localStorage.setItem('mindspace_last_reset', today)
    }
  },

  fetchTasks: async () => {
    set({ loading: true })
    await get().checkDailyReset()
    const { data, error } = await supabase.from('tasks').select('*').order('id')
    if (!error && data) {
      set({
        fixed: data.filter((t) => t.is_fixed),
        new: data.filter((t) => !t.is_fixed),
        loading: false,
      })
    } else {
      set({ loading: false })
    }
  },

  addTask: async (text) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ text, is_fixed: false }])
      .select()
    if (!error && data?.[0]) {
      set((s) => ({ new: [...s.new, data[0]] }))
    }
  },

  toggleTask: async (id) => {
    const state = get()
    let task = state.fixed.find((t) => t.id === id) || state.new.find((t) => t.id === id)
    if (!task) return

    const newCompleted = !task.completed

    // Optimistic UI
    set((s) => ({
      fixed: s.fixed.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)),
      new: s.new.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)),
    }))

    await supabase.from('tasks').update({ completed: newCompleted }).eq('id', id)
  },

  updateTask: async (id, text, isFixed) => {
    const state = get()
    let task = state.fixed.find((t) => t.id === id) || state.new.find((t) => t.id === id)
    if (!task) return

    const changedFixState = task.is_fixed !== isFixed
    const updatedTask = { ...task, text, is_fixed: isFixed }

    if (changedFixState) {
      if (isFixed) {
        set((s) => ({
          new: s.new.filter((t) => t.id !== id),
          fixed: [...s.fixed, updatedTask],
        }))
      } else {
        set((s) => ({
          fixed: s.fixed.filter((t) => t.id !== id),
          new: [...s.new, updatedTask],
        }))
      }
    } else {
      set((s) => ({
        fixed: s.fixed.map((t) => (t.id === id ? updatedTask : t)),
        new: s.new.map((t) => (t.id === id ? updatedTask : t)),
      }))
    }

    await supabase.from('tasks').update({ text, is_fixed: isFixed }).eq('id', id)
  },

  deleteTask: async (id) => {
    set((s) => ({
      fixed: s.fixed.filter((t) => t.id !== id),
      new: s.new.filter((t) => t.id !== id),
    }))
    await supabase.from('tasks').delete().eq('id', id)
  },

  clearNewTasks: async () => {
    set({ new: [] })
    await supabase.from('tasks').delete().eq('is_fixed', false)
  },
}))
