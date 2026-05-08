import { useRef, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useToast } from '../ui/ToastProvider'
import { KEEP_COLORS } from '../ui/ColorPalette'
import Icon from '../ui/Icon'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatCardContent(text, isList) {
  if (!text) return ''
  if (!isList) return text

  const lines = text.split('\n')
  return lines.filter((l) => l.trim()).map((line, i) => {
    const isChecked = line.startsWith('[x] ') || line.startsWith('[X] ')
    const cleanText = line.replace(/^\[[ x]\]\s*/i, '')
    return (
      <div key={i} className="flex items-start gap-2">
        <Icon
          name={isChecked ? 'check_box' : 'check_box_outline_blank'}
          size={16}
          className="mt-0.5 opacity-70"
        />
        <span className={isChecked ? 'line-through opacity-50' : ''}>{cleanText}</span>
      </div>
    )
  })
}

export default function NoteCard({ note, onOpen }) {
  const showToast = useToast()
  const clickTimerRef = useRef(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(note.id) })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const bgColor = KEEP_COLORS.find((c) => c.name === (note.color || 'default'))?.value || 'var(--color-surface)'
  const textColorStyle = note.color && note.color !== 'default' ? { color: '#1a1c18' } : {}

  const sizeClasses = note.card_size === 'large' ? 'md:col-span-2 md:row-span-2' : 'col-span-1 row-span-1'

  const icon = note.is_pinned
    ? <Icon name="push_pin" size={14} className="ml-2" />
    : note.is_archived
      ? <Icon name="inventory_2" size={14} className="ml-2" />
      : null

  const handleClick = useCallback((e) => {
    if (e.target.closest('button')) return
    if (e.detail === 1) {
      clickTimerRef.current = setTimeout(() => onOpen(note.id), 250)
    }
  }, [note.id, onOpen])

  const handleDoubleClick = useCallback(() => {
    clearTimeout(clickTimerRef.current)
    const textEl = document.querySelector(`[data-note-id="${note.id}"] .js-selectable-text`)
    if (textEl) {
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(textEl)
      selection.removeAllRanges()
      selection.addRange(range)

      const text = textEl.innerText || textEl.textContent
      navigator.clipboard.writeText(text).then(() => {
        showToast('Texto copiado!')
      })
    }
  }, [note.id, showToast])

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, backgroundColor: bgColor }}
      {...attributes}
      {...listeners}
      className={`note-block rounded-xl border border-outline-variant p-card-padding ambient-shadow-1 relative group flex flex-col justify-between cursor-pointer min-h-[240px] ${sizeClasses}`}
      data-note-id={note.id}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex justify-between items-start" style={textColorStyle}>
        <h3 className="font-display text-base font-medium flex items-center">
          {note.title || 'Sem título'} {icon}
        </h3>
        <button className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-black/10 rounded-full flex-shrink-0">
          <Icon name="open_in_new" />
        </button>
      </div>
      <div className="mt-4 flex-1" style={textColorStyle}>
        <div className={`font-body text-sm line-clamp-6 w-full overflow-hidden text-ellipsis whitespace-pre-wrap js-selectable-text ${note.is_list ? '' : 'opacity-80'}`}>
          {note.is_list ? (
            <div className="flex flex-col gap-1 mt-1">
              {formatCardContent(note.content, true)}
            </div>
          ) : (
            note.content
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 font-display text-xs opacity-60" style={textColorStyle}>
        <Icon name="drag_indicator" size={16} />
        <span>{formatDate(note.date)}</span>
      </div>
    </div>
  )
}
