import { useState } from 'react'
import { useNotesStore } from '../hooks/useNotes'
import NotesGrid from '../components/notes/NotesGrid'
import NoteModal from '../components/notes/NoteModal'

export default function Archives() {
  const { getArchivedNotes, reorderNote } = useNotesStore()
  const [modalNoteId, setModalNoteId] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const archivedNotes = getArchivedNotes()

  const handleOpenNote = (id) => {
    setModalNoteId(id)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setModalNoteId(null)
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold">Arquivo</h2>
      </div>

      {archivedNotes.length === 0 ? (
        <p className="text-on-surface-variant">Arquivo vazio.</p>
      ) : (
        <NotesGrid
          notes={archivedNotes}
          onOpenNote={handleOpenNote}
          onReorder={reorderNote}
        />
      )}

      {showModal && (
        <NoteModal noteId={modalNoteId} onClose={handleCloseModal} />
      )}
    </div>
  )
}
