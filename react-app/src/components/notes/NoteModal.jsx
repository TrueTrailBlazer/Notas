import { useState, useEffect, useRef, useCallback } from 'react'
import { useNotesStore } from '../../hooks/useNotes'
import { useAutosave } from '../../hooks/useAutosave'
import { useConfirm } from '../ui/ConfirmProvider'
import ColorPalette, { KEEP_COLORS } from '../ui/ColorPalette'
import Icon from '../ui/Icon'

export default function NoteModal({ noteId, onClose }) {
  const { notes, createNote, updateNote, deleteNote } = useNotesStore()
  const confirm = useConfirm()

  const note = noteId ? notes.find((n) => n.id === noteId) : null

  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [isPinned, setIsPinned] = useState(note?.is_pinned || false)
  const [isArchived, setIsArchived] = useState(note?.is_archived || false)
  const [color, setColor] = useState(note?.color || 'default')
  const [cardSize, setCardSize] = useState(note?.card_size || 'normal')
  const [isList, setIsList] = useState(note?.is_list || false)
  const [showColorPalette, setShowColorPalette] = useState(false)
  const [listItems, setListItems] = useState([])

  // Track the real ID (for new notes that get assigned an ID after first save)
  const realIdRef = useRef(noteId)

  // Parse list items from content
  useEffect(() => {
    if (isList && content) {
      const lines = content.split('\n').filter((l) => l.trim())
      setListItems(
        lines.map((line, i) => ({
          id: i,
          checked: line.startsWith('[x] ') || line.startsWith('[X] '),
          text: line.replace(/^\[[ x]\]\s*/i, ''),
        }))
      )
    }
  }, []) // Only on mount

  // Serialize list items to content string
  const getContentFromList = useCallback(() => {
    return listItems
      .filter((item) => item.text.trim())
      .map((item) => `[${item.checked ? 'x' : ' '}] ${item.text}`)
      .join('\n')
  }, [listItems])

  const getCurrentContent = useCallback(() => {
    return isList ? getContentFromList() : content
  }, [isList, content, getContentFromList])

  // Autosave logic
  const performSave = useCallback(async () => {
    const payload = {
      title: title.trim() || 'Sem título',
      content: getCurrentContent(),
      is_pinned: isPinned,
      is_archived: isArchived,
      color,
      card_size: cardSize,
      is_list: isList,
    }

    if (realIdRef.current) {
      await updateNote(realIdRef.current, payload)
    } else {
      const created = await createNote(payload)
      if (created) realIdRef.current = created.id
    }
  }, [title, getCurrentContent, isPinned, isArchived, color, cardSize, isList, updateNote, createNote])

  const triggerAutosave = useAutosave(performSave, 800)

  // Helpers that trigger autosave
  const handleTitleChange = (e) => { setTitle(e.target.value); triggerAutosave() }
  const handleContentChange = (e) => { setContent(e.target.value); triggerAutosave() }

  const handleTogglePin = () => {
    setIsPinned((v) => !v)
    setIsArchived(false)
    triggerAutosave()
  }

  const handleToggleArchive = () => {
    setIsArchived((v) => !v)
    setIsPinned(false)
    triggerAutosave()
  }

  const handleColorChange = (c) => {
    setColor(c)
    setShowColorPalette(false)
    triggerAutosave()
  }

  const handleToggleSize = () => {
    setCardSize((v) => (v === 'normal' ? 'large' : 'normal'))
    triggerAutosave()
  }

  const handleToggleList = () => {
    if (!isList) {
      // Convert text to list
      const lines = content.split('\n').filter((l) => l.trim())
      setListItems(
        lines.map((line, i) => ({
          id: Date.now() + i,
          checked: false,
          text: line,
        }))
      )
    } else {
      // Convert list to text
      setContent(getContentFromList())
    }
    setIsList((v) => !v)
    triggerAutosave()
  }

  const handleDelete = async () => {
    if (!realIdRef.current) { onClose(); return }
    const ok = await confirm('Deletar Nota', 'Esta ação é irreversível. Deseja deletar esta nota permanentemente?')
    if (ok) {
      await deleteNote(realIdRef.current)
      onClose()
    }
  }

  // List item handlers
  const updateListItem = (id, updates) => {
    setListItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
    triggerAutosave()
  }

  const removeListItem = (id) => {
    setListItems((prev) => prev.filter((item) => item.id !== id))
    triggerAutosave()
  }

  const addListItem = () => {
    setListItems((prev) => [...prev, { id: Date.now(), checked: false, text: '' }])
  }

  const handleListKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addListItem()
    }
  }

  const bgColor = KEEP_COLORS.find((c) => c.name === color)?.value || 'var(--color-surface)'

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl h-[85vh] rounded-2xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95"
        style={{ backgroundColor: bgColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-2">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="font-display text-2xl font-semibold text-on-background bg-transparent border-none focus:ring-0 w-full outline-none placeholder-on-surface-variant"
            placeholder="Título"
          />
          <button
            onClick={handleTogglePin}
            className="p-2 rounded-full hover:bg-black/5 text-on-surface-variant transition-colors flex items-center justify-center flex-shrink-0"
            title="Fixar Nota"
          >
            <Icon name="push_pin" fill={isPinned} className={isPinned ? 'text-primary' : ''} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-2 flex-1 overflow-y-auto relative">
          {isList ? (
            <div className="flex flex-col gap-2 w-full pb-4">
              {listItems.map((item, index) => (
                <div key={item.id} className="list-item-row flex items-center gap-3 group">
                  <input
                    type="checkbox"
                    className="sleek-checkbox"
                    checked={item.checked}
                    onChange={(e) => updateListItem(item.id, { checked: e.target.checked })}
                  />
                  <input
                    type="text"
                    className={`list-item-input flex-1 bg-transparent text-on-surface text-lg ${
                      item.checked ? 'line-through opacity-50' : ''
                    }`}
                    value={item.text}
                    onChange={(e) => updateListItem(item.id, { text: e.target.value })}
                    onKeyDown={(e) => handleListKeyDown(e, index)}
                    placeholder="Item da lista"
                    autoFocus={!item.text}
                  />
                  <button
                    className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error transition-opacity"
                    onClick={() => removeListItem(item.id)}
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>
              ))}
              <button
                onClick={addListItem}
                className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mt-2 text-sm px-2 font-medium"
              >
                <Icon name="add" size={18} /> Adicionar item
              </button>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={handleContentChange}
              className="w-full h-full bg-transparent border-none resize-none focus:ring-0 font-body text-base text-on-surface outline-none leading-relaxed placeholder-on-surface-variant"
              placeholder="Criar uma nota..."
            />
          )}
        </div>

        {/* Toolbar */}
        <div className="p-3 px-6 border-t border-black/5 flex justify-between items-center bg-black/5 relative">
          <div className="flex gap-1 items-center relative">
            <button
              onClick={() => setShowColorPalette((v) => !v)}
              className="p-2 rounded-full hover:bg-black/10 text-on-surface-variant transition-colors flex items-center justify-center"
              title="Cor de fundo"
            >
              <Icon name="palette" size={20} />
            </button>

            {showColorPalette && (
              <div className="absolute bottom-full left-0 mb-2">
                <ColorPalette selectedColor={color} onSelect={handleColorChange} />
              </div>
            )}

            <button
              onClick={handleToggleList}
              className={`p-2 rounded-full hover:bg-black/10 transition-colors flex items-center justify-center ${isList ? 'text-primary' : 'text-on-surface-variant'}`}
              title="Mostrar caixas de seleção"
            >
              <Icon name="checklist" size={20} />
            </button>

            <button
              onClick={handleToggleSize}
              className={`p-2 rounded-full hover:bg-black/10 transition-colors flex items-center justify-center ${cardSize === 'large' ? 'text-primary' : 'text-on-surface-variant'}`}
              title="Destacar tamanho do card"
            >
              <Icon name="aspect_ratio" size={20} />
            </button>

            <div className="w-px h-5 bg-outline-variant/50 mx-2" />

            <button
              onClick={handleToggleArchive}
              className="p-2 rounded-full hover:bg-black/10 text-on-surface-variant transition-colors flex items-center justify-center"
              title="Arquivar"
            >
              <Icon name="inventory_2" fill={isArchived} className={isArchived ? 'text-primary' : ''} size={20} />
            </button>

            {realIdRef.current && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-full hover:bg-error/20 text-error transition-colors flex items-center justify-center"
                title="Excluir"
              >
                <Icon name="delete" size={20} />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 font-medium text-on-background hover:bg-black/10 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
