import { useState } from 'react'
import { useNotesStore } from '../hooks/useNotes'
import NotesGrid from '../components/notes/NotesGrid'
import NewNoteButton from '../components/notes/NewNoteButton'
import NoteModal from '../components/notes/NoteModal'

export default function Dashboard({ selectedDate }) {
  const { getActiveNotes, reorderNote, searchQuery } = useNotesStore()
  const [modalNoteId, setModalNoteId] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const activeNotes = getActiveNotes()

  // Filter by selected date if it's not today
  const today = new Date()
  const isToday =
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear()

  let filteredNotes = activeNotes
  if (!isToday) {
    filteredNotes = activeNotes.filter((n) => {
      const noteDate = new Date(n.date)
      return (
        noteDate.getDate() === selectedDate.getDate() &&
        noteDate.getMonth() === selectedDate.getMonth() &&
        noteDate.getFullYear() === selectedDate.getFullYear()
      )
    })
  }

  const handleOpenNote = (id) => {
    setModalNoteId(id)
    setShowModal(true)
  }

  const handleCreateNote = () => {
    setModalNoteId(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setModalNoteId(null)
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold">Seu Espaço</h2>
        {!isToday && (
          <p className="text-on-surface-variant text-sm mt-1">
            Mostrando notas de {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      <NotesGrid
        notes={filteredNotes}
        onOpenNote={handleOpenNote}
        onReorder={reorderNote}
      >
        {searchQuery === '' && <NewNoteButton onClick={handleCreateNote} />}
      </NotesGrid>

      {filteredNotes.length === 0 && searchQuery === '' && !isToday && (
        <p className="text-on-surface-variant text-center mt-12">Nenhuma nota encontrada para esta data.</p>
      )}

      {showModal && (
        <NoteModal noteId={modalNoteId} onClose={handleCloseModal} />
      )}
    </div>
  )
}
