import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useNotesStore = create((set, get) => ({
  notes: [],
  searchQuery: '',
  loading: false,

  setSearchQuery: (q) => set({ searchQuery: q }),

  fetchNotes: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('date', { ascending: false })
    if (!error && data) set({ notes: data })
    set({ loading: false })
  },

  createNote: async (payload) => {
    const fullPayload = { ...payload, date: new Date().toISOString() }
    const { data, error } = await supabase
      .from('notes')
      .insert([fullPayload])
      .select()
    if (!error && data?.[0]) {
      set((s) => ({ notes: [data[0], ...s.notes] }))
      return data[0]
    }
    return null
  },

  updateNote: async (id, payload) => {
    // Optimistic UI
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...payload } : n)),
    }))
    await supabase.from('notes').update(payload).eq('id', id)
  },

  deleteNote: async (id) => {
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
    await supabase.from('notes').delete().eq('id', id)
  },

  reorderNote: async (draggedId, overIndex, visibleNotes) => {
    const notes = get().notes
    let newTime

    if (overIndex === 0) {
      const nextNote = visibleNotes[0]
      if (nextNote && nextNote.id !== draggedId) {
        newTime = new Date(nextNote.date).getTime() + 60000
      } else {
        newTime = Date.now() + 60000
      }
    } else if (overIndex >= visibleNotes.length) {
      const prevNote = visibleNotes[visibleNotes.length - 1]
      newTime = new Date(prevNote.date).getTime() - 60000
    } else {
      const prevNote = visibleNotes[overIndex - 1]
      const nextNote = visibleNotes[overIndex]
      if (prevNote && nextNote) {
        newTime = (new Date(prevNote.date).getTime() + new Date(nextNote.date).getTime()) / 2
      } else {
        newTime = Date.now()
      }
    }

    const newIsoDate = new Date(newTime).toISOString()

    // Optimistic
    const updated = notes.map((n) =>
      n.id === draggedId ? { ...n, date: newIsoDate } : n
    )
    updated.sort((a, b) => new Date(b.date) - new Date(a.date))
    set({ notes: updated })

    await supabase.from('notes').update({ date: newIsoDate }).eq('id', draggedId)
  },

  // Memoized getters
  getActiveNotes: () => {
    const { notes, searchQuery } = get()
    let filtered = notes
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = notes.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.content && n.content.toLowerCase().includes(q))
      )
    }
    return filtered.filter((n) => !n.is_archived)
  },

  getPinnedNotes: () => {
    const { notes, searchQuery } = get()
    let filtered = notes
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = notes.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.content && n.content.toLowerCase().includes(q))
      )
    }
    return filtered.filter((n) => n.is_pinned && !n.is_archived)
  },

  getArchivedNotes: () => {
    const { notes, searchQuery } = get()
    let filtered = notes
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = notes.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.content && n.content.toLowerCase().includes(q))
      )
    }
    return filtered.filter((n) => n.is_archived)
  },
}))
