import { useState } from 'react'
import Icon from '../ui/Icon'

export default function AddTaskInput({ onAdd }) {
  const [text, setText] = useState('')

  const handleAdd = () => {
    if (text.trim()) {
      onAdd(text.trim())
      setText('')
    }
  }

  return (
    <div className="flex items-center gap-2 bg-surface rounded-lg border border-outline-variant p-2 focus-within:border-primary transition-colors">
      <button
        onClick={handleAdd}
        className="text-on-surface-variant hover:text-primary transition-colors flex-shrink-0"
      >
        <Icon name="add" />
      </button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
        className="w-full bg-transparent border-none p-0 focus:ring-0 text-on-surface outline-none text-sm"
        placeholder="Adicionar tarefa rápida..."
      />
    </div>
  )
}
