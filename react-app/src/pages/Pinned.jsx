import { useState } from 'react'
import { useNotesStore } from '../hooks/useNotes'
import NotesGrid from '../components/notes/NotesGrid'
import NoteModal from '../components/notes/NoteModal'

export default function Pinned() {
  const { getPinnedNotes, reorderNote } = useNotesStore()
  const [modalNoteId, setModalNoteId] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const pinnedNotes = getPinnedNotes()

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
        <h2 className="font-display text-2xl font-semibold">Fixadas</h2>
      </div>

      {pinnedNotes.length === 0 ? (
        <p className="text-on-surface-variant">Nenhuma nota fixada.</p>
      ) : (
        <NotesGrid
          notes={pinnedNotes}
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
