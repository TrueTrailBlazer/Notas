import { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { useLayoutStore } from '../../stores/useLayoutStore'
import NoteCard from './NoteCard'

const GRID_CLASSES = {
  small: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  medium: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  large: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3',
}

export default function NotesGrid({ notes, onOpenNote, onReorder, children }) {
  const gridSize = useLayoutStore((s) => s.gridSize)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const sortableIds = useMemo(() => notes.map((n) => String(n.id)), [notes])

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = notes.findIndex((n) => String(n.id) === active.id)
    const newIndex = notes.findIndex((n) => String(n.id) === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    onReorder(parseInt(active.id), newIndex, notes)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
        <div className={`grid gap-gutter transition-all duration-300 auto-rows-auto ${GRID_CLASSES[gridSize] || GRID_CLASSES.medium}`}>
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onOpen={onOpenNote} />
          ))}
          {children}
        </div>
      </SortableContext>
    </DndContext>
  )
}
