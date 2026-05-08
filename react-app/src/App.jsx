import { useEffect, useState } from 'react'
import { useAuthStore } from './stores/useAuthStore'
import { useThemeStore } from './stores/useThemeStore'
import { useLayoutStore } from './stores/useLayoutStore'
import { useNotesStore } from './hooks/useNotes'
import { useTasksStore } from './hooks/useTasks'
import ToastProvider from './components/ui/ToastProvider'
import ConfirmProvider from './components/ui/ConfirmProvider'
import LoginOverlay from './components/auth/LoginOverlay'
import Layout from './components/layout/Layout'
import NoteModal from './components/notes/NoteModal'
import Dashboard from './pages/Dashboard'
import Pinned from './pages/Pinned'
import Archives from './pages/Archives'
import Settings from './pages/Settings'
import Icon from './components/ui/Icon'

export default function App() {
  const { session, loading, checkSession } = useAuthStore()
  const hydrate = useThemeStore((s) => s.hydrate)
  const activeView = useLayoutStore((s) => s.activeView)
  const fetchNotes = useNotesStore((s) => s.fetchNotes)
  const fetchTasks = useTasksStore((s) => s.fetchTasks)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [fabModalOpen, setFabModalOpen] = useState(false)

  // Check session + hydrate theme on mount
  useEffect(() => {
    checkSession()
    hydrate()
  }, [checkSession, hydrate])

  // Fetch data when session is available
  useEffect(() => {
    if (session) {
      fetchNotes()
      fetchTasks()
    }
  }, [session, fetchNotes, fetchTasks])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icon name="progress_activity" className="text-primary animate-spin text-4xl" />
          <p className="text-on-surface-variant font-body text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <ToastProvider>
        <LoginOverlay />
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <Layout selectedDate={selectedDate} onSelectDate={setSelectedDate}>
          {activeView === 'dashboard' && <Dashboard selectedDate={selectedDate} />}
          {activeView === 'pinned' && <Pinned />}
          {activeView === 'archives' && <Archives />}
          {activeView === 'settings' && <Settings />}
        </Layout>

        {/* FAB - Create Note (visible on all views except settings) */}
        {activeView !== 'settings' && (
          <button
            onClick={() => setFabModalOpen(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-2xl ambient-shadow-2 hover:scale-105 transition-all flex items-center justify-center z-[500] group shadow-lg cursor-pointer"
          >
            <Icon name="edit_document" className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        )}

        {fabModalOpen && (
          <NoteModal noteId={null} onClose={() => setFabModalOpen(false)} />
        )}
      </ConfirmProvider>
    </ToastProvider>
  )
}
